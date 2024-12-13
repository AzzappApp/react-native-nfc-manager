/* eslint-disable prefer-const */
import { BlurStyle, Skia } from '@shopify/react-native-skia';
import { interpolate } from 'react-native-reanimated';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { convertToBaseCanvasRatio } from '@azzapp/shared/coverHelpers';
import {
  applyImageFrameTransformations,
  applyShaderTransformations,
  createImageFromNativeTexture,
  cropDataForAspectRatio,
  getTransformsForEditionParameters,
  imageFrameFromImage,
  imageFrameToShaderFrame,
  scaleCropData,
} from '#helpers/mediaEditions';
import { percentRectToRect } from '../coverEditorHelpers';
import { inflateRRect } from './coverDrawerHelpers';
import overlayAnimations from './overlayAnimations';
import type { CoverDrawerOptions } from './coverDrawerTypes';
import type { CanvasAnimation, PaintAnimation } from './overlayAnimations';

const coverOverlayDrawer = ({
  canvas,
  width,
  height,
  coverEditorState: { overlayLayers, cardColors, imagesScales },
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
    id,
    width: overlayWidth,
    height: overlayHeight,
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
  const image = createImageFromNativeTexture(images[id]);
  if (!image) {
    return;
  }

  if (
    currentTime < (startPercentageTotal * duration) / 100 ||
    currentTime > (endPercentageTotal * duration) / 100
  ) {
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
      overlayWidth,
      overlayHeight,
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
        cropData: scaleCropData(cropData, imagesScales[id] ?? 1),
        roll,
      },
      lutShader: filter ? lutShaders[filter] : null,
    });

  const animation = overlayLayer.animation
    ? overlayAnimations[overlayLayer.animation]
    : null;

  let animateCanvas: CanvasAnimation | undefined = undefined;
  let animatePaint: PaintAnimation | undefined = undefined;

  if (animation) {
    const progress = interpolate(
      currentTime,
      [
        (startPercentageTotal * duration) / 100,
        (endPercentageTotal * duration) / 100,
        duration,
      ],
      [0, 1],
    );
    const transformations = animation(progress);
    ({ animateCanvas, animatePaint } = transformations);
  }

  const { shader } = applyShaderTransformations(
    imageFrameToShaderFrame(
      applyImageFrameTransformations(imageFrame, imageTransformations),
    ),
    shaderTransformations,
  );

  const overlayRect = {
    x: 0,
    y: 0,
    height: imageHeight,
    width: imageWidth,
  };
  const borderWidthPx = convertToBaseCanvasRatio(borderWidth, width);

  const outerRect = {
    rect: overlayRect,
    rx: (borderRadius * width) / 200,
    ry: (borderRadius * width) / 200,
  };
  const innerRect = {
    rect: {
      x: borderWidthPx,
      y: borderWidthPx,
      width: imageWidth - 2 * borderWidthPx,
      height: imageHeight - 2 * borderWidthPx,
    },
    rx: (borderRadius * width - borderWidthPx) / 200,
    ry: (borderRadius * width - borderWidthPx) / 200,
  };
  animateCanvas?.(canvas, overlayRect);

  if (shadow && borderWidth > 0) {
    const shadowPaint = Skia.Paint();
    shadowPaint.setColor(Skia.Color('#00000099'));
    animatePaint?.(shadowPaint, overlayRect);
    shadowPaint.setMaskFilter(
      Skia.MaskFilter.MakeBlur(
        BlurStyle.Normal,
        convertToBaseCanvasRatio(8, width),
        true,
      ),
    );
    canvas.drawRRect(
      inflateRRect(
        outerRect,
        convertToBaseCanvasRatio(4, width),
        convertToBaseCanvasRatio(4, width),
        0,
        convertToBaseCanvasRatio(4, width),
      ),
      shadowPaint,
    );
  }

  const paint = Skia.Paint();
  paint.setShader(shader);
  if (shadow && borderWidth === 0) {
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
  animatePaint?.(paint, overlayRect);
  canvas.drawRRect(innerRect, paint);

  if (borderWidth > 0) {
    const borderPaint = Skia.Paint();
    borderPaint.setColor(Skia.Color(swapColor(borderColor, cardColors)));
    animatePaint?.(borderPaint, overlayRect);
    canvas.drawDRRect(outerRect, innerRect, borderPaint);
  }
  canvas.restore();
};

export default coverOverlayDrawer;
