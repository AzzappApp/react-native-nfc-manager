import {
  Skia,
  type SkImageFilter,
  type SkImage,
} from '@shopify/react-native-skia';
import { COVER_MAX_MEDIA_DURATION } from '@azzapp/shared/coverHelpers';
import {
  createImageFromNativeTexture,
  createImageFromVideoFrame,
  scaleCropData,
  transformImage,
} from '#helpers/mediaEditions';
import coverTransitions from './coverTransitions';
import mediaAnimations from './mediaAnimations';
import type { ImageInfo } from '#helpers/mediaEditions';
import type { CoverDrawerOptions } from './coverDrawerTypes';
import type { MediaAnimation } from './mediaAnimations';

const coverMediasDrawer = ({
  canvas,
  width,
  height,
  coverEditorState: { coverTransition, medias, imagesScales },
  currentTime,
  images,
  lutTextures,
  frames,
  videoScales,
}: CoverDrawerOptions) => {
  'worklet';
  let duration = 0;
  const { transition, duration: transitionDuration } = (coverTransition &&
    coverTransitions[coverTransition]) || { transition: null, duration: 0 };

  let inImage: SkImageFilter | null = null;
  let outImage: SkImageFilter | null = null;
  let transitionTime = 0;
  for (let i = 0; i < medias.length; i++) {
    const media = medias[i];
    const isLast = i === medias.length - 1;
    let mediaDuration: number;

    if (media.kind === 'image') {
      mediaDuration = media.duration;
    } else {
      mediaDuration = media.timeRange.duration;
    }
    mediaDuration = Math.min(mediaDuration, COVER_MAX_MEDIA_DURATION);

    const compositionStartTime = Math.max(duration - transitionDuration, 0);
    const compositionEndTime = compositionStartTime + mediaDuration;

    if (
      compositionStartTime <= currentTime &&
      currentTime < compositionEndTime
    ) {
      const { filter, editionParameters } = media;
      let image: SkImage | null = null;
      let imageInfo: ImageInfo | null = null;
      let scale = 1;
      let animation: MediaAnimation | null = null;
      if (media.kind === 'image') {
        image = createImageFromNativeTexture(images[media.id]);
        if (!image) {
          continue;
        }
        imageInfo = {
          matrix: Skia.Matrix(),
          width: images[media.id].width,
          height: images[media.id].height,
        };
        scale = imagesScales[media.id] ?? 1;
        animation = media.animation ? mediaAnimations[media.animation] : null;
      } else {
        const frame = frames[media.id];
        scale = videoScales[media.id] ?? 1;
        ({ image, imageInfo } = createImageFromVideoFrame(frame) ?? {
          image: null,
          imageInfo: null,
        });
        if (!image) {
          continue;
        }
      }
      if (!image || !imageInfo) {
        continue;
      }

      if (animation) {
        const progress = (currentTime - compositionStartTime) / mediaDuration;
        const transform = animation(progress);
        if (transform) {
          imageInfo = transform(imageInfo);
        }
      }

      const imageFilter = transformImage({
        image,
        targetWidth: width,
        targetHeight: height,
        imageInfo,
        editionParameters: {
          ...editionParameters,
          cropData: editionParameters?.cropData
            ? scaleCropData(editionParameters.cropData, scale)
            : undefined,
        },
        lutTexture: filter ? lutTextures[filter] : undefined,
      });

      if (currentTime >= compositionEndTime - transitionDuration && !isLast) {
        outImage = imageFilter;
        transitionTime =
          currentTime - (compositionEndTime - transitionDuration);
      } else {
        inImage = imageFilter;
      }
    }
    duration = Math.max(0, duration - transitionDuration);
    duration += mediaDuration;
  }
  if (inImage && outImage && transition) {
    transition({
      canvas,
      inImage,
      outImage,
      time: transitionTime,
      width,
      height,
    });
  } else if (inImage) {
    const paint = Skia.Paint();
    paint.setImageFilter(inImage);

    canvas.drawRect(
      {
        x: 0,
        y: 0,
        width,
        height,
      },
      paint,
    );
  }
};

export default coverMediasDrawer;
