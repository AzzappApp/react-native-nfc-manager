/* eslint-disable prefer-const */
import { PaintStyle, Skia } from '@shopify/react-native-skia';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  createImageFromNativeBuffer,
  cropDataForAspectRatio,
  transformImage,
} from '#helpers/mediaEditions';
import { mediaInfoIsImage, percentRectToRect } from '../coverEditorHelpers';
import overlayAnimations from './overlayAnimations';
import { convertToBaseCanvasRatio, createRRect } from './utils';
import type { CoverDrawerOptions } from './types';

const coverOverlayDrawer = ({
  canvas,
  width,
  height,
  coverEditorState: { overlayLayers, cardColors, medias },
  index,
  images,
  lutShaders,
  currentTime,
}: CoverDrawerOptions & { index: number }) => {
  'worklet';
  //get the total duration of the cover

  const overlayLayer = overlayLayers[index];
  if (!overlayLayer) {
    return;
  }
  const {
    media,
    filter,
    bounds,
    editionParameters,
    rotation,
    borderColor,
    borderRadius,
    borderWidth,
    shadow,
    animation,
    startPercentageTotal,
    endPercentageTotal,
  } = overlayLayer;
  const totalDuration = medias.reduce((acc, media) => {
    if (mediaInfoIsImage(media)) {
      return acc + media.duration;
    } else {
      return acc + media.timeRange.duration;
    }
  }, 0);

  const startDraw = totalDuration * startPercentageTotal;
  const endDraw = totalDuration * endPercentageTotal;

  if (currentTime >= startDraw && currentTime <= endDraw) {
    const image = createImageFromNativeBuffer(images[media.uri], true);
    if (!image) {
      return;
    }
    let {
      x,
      y,
      width: imageWidth,
      height: imageHeight,
    } = percentRectToRect(bounds, width, height);
    canvas.save();

    canvas.translate(x - imageWidth / 2, y - imageHeight / 2);
    if (rotation) {
      canvas.rotate(
        (rotation * 180) / Math.PI,
        imageWidth / 2,
        imageHeight / 2,
      );
    }
    let cropData = editionParameters?.cropData;
    let roll = editionParameters?.roll;
    if (
      !cropData ||
      // minor difference is allowed since canvas aspect ration might not be exactly
      // the same as the COVER_ASPECT_RATIO
      Math.abs(cropData.width / cropData.height - imageWidth / imageHeight) >
        0.02
    ) {
      cropData = cropDataForAspectRatio(
        media.width,
        media.height,
        imageWidth / imageHeight,
      );
      roll = 0;
    }

    const shader = transformImage({
      image,
      lutShader: filter ? lutShaders[filter] : null,
      width: imageWidth,
      height: imageHeight,
      editionParameters: {
        ...editionParameters,
        cropData,
        roll,
      },
      animation: animation
        ? {
            animateMatrix: overlayAnimations[animation]?.animateMatrix,
            end: endDraw,
            start: startDraw,
            time: currentTime,
          }
        : null,
    });
    let paint;
    if (animation && overlayAnimations[animation]) {
      paint = overlayAnimations[animation].animateShader({
        shader,
        time: currentTime,
        start: startDraw,
        end: endDraw,
      });
    } else {
      paint = Skia.Paint();
      paint.setShader(shader);
    }

    if (shadow) {
      paint.setImageFilter(
        Skia.ImageFilter.MakeDropShadow(
          0,
          convertToBaseCanvasRatio(4, width),
          convertToBaseCanvasRatio(8, width),
          convertToBaseCanvasRatio(8, width),
          Skia.Color('#00000099'),
          null,
        ),
      );
    }

    canvas.drawRRect(createRRect(imageWidth, imageHeight, borderRadius), paint);
    if (borderWidth > 0) {
      const borderPaint = Skia.Paint();
      borderPaint.setColor(Skia.Color(swapColor(borderColor, cardColors)));
      borderPaint.setStyle(PaintStyle.Stroke);
      borderPaint.setStrokeWidth((borderWidth * imageWidth) / 100);
      canvas.drawRRect(
        createRRect(imageWidth, imageHeight, borderRadius),
        borderPaint,
      );
    }
    canvas.restore();
  }
  return null;
};

export default coverOverlayDrawer;
