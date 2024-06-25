import {
  applyImageFrameTransformations,
  createImageFromNativeBuffer,
  imageFrameFromImage,
  imageFrameFromVideoFrame,
  imageFrameTransformations,
  scaleCropData,
} from '#helpers/mediaEditions';
import { mediaInfoIsImage } from '../coverEditorHelpers';
import type { ImageFrame } from '#helpers/mediaEditions';
import type { CoverDrawerOptions } from './coverDrawerTypes';
import type { SkImage, SkMatrix } from '@shopify/react-native-skia';

const coverSkottieDrawer = ({
  canvas,
  width,
  height,
  coverEditorState: { medias },
  images,
  frames,
  currentTime,
  skottiePlayer,
  videoScales,
  lottieInfo,
}: CoverDrawerOptions) => {
  'worklet';
  if (!skottiePlayer || !lottieInfo) {
    return;
  }
  const imagesMap: Record<
    string,
    {
      image: SkImage;
      matrix: number[] | SkMatrix | null;
    }
  > = {};
  for (let i = 0; i < medias.length; i++) {
    const mediaInfo = medias[i];
    const asset = lottieInfo.assetsInfos[i];
    if (!asset) {
      console.error("Too many medias for the template's assets");
      break;
    }
    let imageFrame: ImageFrame | null = null;
    let scale = 1;
    if (mediaInfoIsImage(mediaInfo)) {
      const image = createImageFromNativeBuffer(
        images[mediaInfo.media.uri],
        true,
      );
      imageFrame = image ? imageFrameFromImage(image) : null;
    } else {
      imageFrame = imageFrameFromVideoFrame(frames[asset.id]) ?? null;
      scale = videoScales[mediaInfo.media.uri] ?? 1;
    }
    if (!imageFrame) {
      continue;
    }
    const { editionParameters } = mediaInfo;
    const { orientation, roll } = editionParameters ?? {};
    let cropData = editionParameters?.cropData;
    if (cropData && scale !== 1) {
      cropData = scaleCropData(cropData, scale);
    }

    imageFrame = applyImageFrameTransformations(imageFrame, [
      imageFrameTransformations.orientation(orientation),
      imageFrameTransformations.roll(roll),
      imageFrameTransformations.crop(cropData),
      imageFrameTransformations.scale(asset.width, asset.height),
    ]);

    imagesMap[asset.id] = {
      image: imageFrame.image,
      // android cast of HostObject force us to use get() method
      matrix: imageFrame.matrix.get(),
    };
  }
  const progress = currentTime / lottieInfo.duration;
  skottiePlayer.render(
    canvas,
    { x: 0, y: 0, width, height },
    progress,
    imagesMap,
  );
};

export default coverSkottieDrawer;
