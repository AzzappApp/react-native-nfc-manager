/* eslint-disable prefer-const */
import { PaintStyle, Skia } from '@shopify/react-native-skia';
import { interpolate } from 'react-native-reanimated';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  applyImageFrameTransformations,
  applyShaderTransformations,
  createImageFromNativeBuffer,
  cropDataForAspectRatio,
  getTransformsForEditionParameters,
  imageFrameFromImage,
  imageFrameToShaderFrame,
} from '#helpers/mediaEditions';
import { percentRectToRect } from '../coverEditorHelpers';
import { convertToBaseCanvasRatio, createRRect } from './coverDrawerUtils';
import overlayAnimations from './overlayAnimations';
import type { CoverDrawerOptions } from './coverDrawerTypes';
import type { DrawTransform } from '../coverEditorTypes';

const coverOverlayDrawer = ({
  canvas,
  width,
  height,
  coverEditorState: { overlayLayers, cardColors },
  index,
  images,
  lutShaders,
  currentTime,
  videoComposition: { duration },
}: CoverDrawerOptions & { index: number }) => {
  'worklet';
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
    startPercentageTotal,
    endPercentageTotal,
  } = overlayLayer;
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
    canvas.rotate((rotation * 180) / Math.PI, imageWidth / 2, imageHeight / 2);
  }
  let cropData = editionParameters?.cropData;
  let roll = editionParameters?.roll;
  if (
    !cropData ||
    // minor difference is allowed since canvas aspect ration might not be exactly
    // the same as the COVER_ASPECT_RATIO
    Math.abs(cropData.width / cropData.height - imageWidth / imageHeight) > 0.02
  ) {
    cropData = cropDataForAspectRatio(
      media.width,
      media.height,
      imageWidth / imageHeight,
    );
    roll = 0;
  }
  const imageFrame = imageFrameFromImage(image);
  const { imageTransformations, shaderTransformations } =
    getTransformsForEditionParameters({
      width: imageWidth,
      height: imageHeight,
      editionParameters: {
        ...editionParameters,
        cropData,
        roll,
      },
      lutShader: filter ? lutShaders[filter] : null,
    });

  const animation = overlayLayer.animation
    ? overlayAnimations[overlayLayer.animation]
    : null;

  let drawTransform: DrawTransform | null = null;

  if (animation) {
    const progress = interpolate(
      currentTime,
      [
        0,
        startPercentageTotal * duration,
        endPercentageTotal * duration,
        duration,
      ],
      [-1, 0, 1, 2],
    );
    const transformations = animation(progress);
    const { imageTransform, shaderTransform } = transformations;
    drawTransform = transformations.drawTransform ?? null;
    if (imageTransform) {
      imageTransformations.push(imageTransform);
    }
    if (shaderTransform) {
      shaderTransformations.push(shaderTransform);
    }
  }

  const { shader } = applyShaderTransformations(
    imageFrameToShaderFrame(
      applyImageFrameTransformations(imageFrame, imageTransformations),
    ),
    shaderTransformations,
  );

  const paint = Skia.Paint();
  paint.setShader(shader);

  if (drawTransform) {
    drawTransform(canvas, paint);
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
};

export default coverOverlayDrawer;
