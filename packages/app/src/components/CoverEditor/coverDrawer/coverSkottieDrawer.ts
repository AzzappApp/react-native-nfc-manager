import { Skia, type SkImage, type SkMatrix } from '@shopify/react-native-skia';
import {
  createImageFromNativeTexture,
  createImageFromVideoFrame,
  scaleCropData,
  transformImageInfo,
} from '#helpers/mediaEditions';
import type { ImageInfo } from '#helpers/mediaEditions';
import type { CoverDrawerOptions } from './coverDrawerTypes';

const coverSkottieDrawer = ({
  canvas,
  width,
  height,
  coverEditorState: { medias, imagesScales },
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
    const media = medias[i];
    const asset = lottieInfo.assetsInfos[i];
    if (!asset) {
      console.error("Too many medias for the template's assets");
      break;
    }
    let image: SkImage | null = null;
    let imageInfo: ImageInfo | null = null;
    let scale = 1;
    if (media.kind === 'image') {
      image = createImageFromNativeTexture(images[media.id]);
      scale = imagesScales[media.id] ?? 1;
      imageInfo = image
        ? {
            width: image.width(),
            height: image.height(),
            matrix: Skia.Matrix(),
          }
        : null;
    } else {
      ({ image, imageInfo } = createImageFromVideoFrame(frames[asset.id]) ?? {
        image: null,
        imageInfo: null,
      });
      scale = videoScales[media.id] ?? 1;
    }
    if (!image || !imageInfo) {
      continue;
    }
    const { editionParameters } = media;
    const { orientation, roll } = editionParameters ?? {};
    let cropData = editionParameters?.cropData;
    if (cropData && scale !== 1) {
      cropData = scaleCropData(cropData, scale);
    }

    imageInfo = transformImageInfo({
      imageInfo,
      targetWidth: asset.width,
      targetHeight: asset.height,
      editionParameters: {
        orientation,
        cropData,
        roll,
      },
    });

    imagesMap[asset.id] = {
      image,
      // android cast of HostObject force us to use get() method
      matrix: imageInfo.matrix.get(),
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
