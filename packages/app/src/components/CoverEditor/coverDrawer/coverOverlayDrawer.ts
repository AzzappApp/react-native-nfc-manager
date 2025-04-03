/* eslint-disable prefer-const */
import { BlurStyle, ClipOp, Skia } from '@shopify/react-native-skia';
import { interpolate } from 'react-native-reanimated';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { convertToBaseCanvasRatio } from '@azzapp/shared/coverHelpers';
import {
  createImageFromNativeTexture,
  cropDataForAspectRatio,
  scaleCropData,
  transformImage,
} from '#helpers/mediaEditions';
import { percentRectToRect } from '../coverEditorHelpers';
import { inflateRRect } from './coverDrawerHelpers';
import overlayAnimations from './overlayAnimations';
import type { CoverDrawerOptions } from './coverDrawerTypes';
import type {
  CanvasAnimation,
  ImageFilterAnimation,
  PaintAnimation,
} from './overlayAnimations';

const coverOverlayDrawer = ({
  canvas,
  width,
  height,
  coverEditorState: { overlayLayers, cardColors, imagesScales },
  index,
  images,
  lutTextures,
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

  const animation = overlayLayer.animation
    ? overlayAnimations[overlayLayer.animation]
    : null;

  let animateCanvas: CanvasAnimation | undefined = undefined;
  let animatePaint: PaintAnimation | undefined = undefined;
  let animateImageFilter: ImageFilterAnimation | undefined = undefined;

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
    ({ animateCanvas, animatePaint, animateImageFilter } = transformations);
  }

  const overlayRect = {
    x: 0,
    y: 0,
    height: imageHeight,
    width: imageWidth,
  };

  animateCanvas?.(canvas, overlayRect);
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

  let cropData = editionParameters?.cropData;
  let roll = editionParameters?.roll;
  if (
    !cropData ||
    // minor difference is allowed since canvas aspect ratio might not be exactly
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
  let imageFilter = transformImage({
    image,
    imageInfo: {
      matrix: Skia.Matrix(),
      width: image.width(),
      height: image.height(),
    },
    targetWidth: imageWidth,
    targetHeight: imageHeight,
    editionParameters: {
      ...editionParameters,
      cropData: scaleCropData(cropData, imagesScales[id] ?? 1),
      roll,
    },
    lutTexture: filter ? lutTextures[filter] : null,
  });

  // We will clip the inner rect with border radius so we need to draw the shadow
  if (shadow) {
    let shadowImageFilter = transformImage({
      image,
      imageInfo: {
        matrix: Skia.Matrix(),
        width: image.width(),
        height: image.height(),
      },
      targetWidth: imageWidth,
      targetHeight: imageHeight,
      editionParameters: {
        ...editionParameters,
        cropData: scaleCropData(cropData, imagesScales[id] ?? 1),
        roll,
      },
      lutTexture: filter ? lutTextures[filter] : null,
    });

    shadowImageFilter = Skia.ImageFilter.MakeCrop(
      innerRect.rect,
      shadowImageFilter,
    );

    const shadowPaint = Skia.Paint();
    if (borderWidth > 0) {
      shadowPaint.setColor(Skia.Color('#00000099'));
      shadowPaint.setMaskFilter(
        Skia.MaskFilter.MakeBlur(
          BlurStyle.Normal,
          convertToBaseCanvasRatio(8, width),
          true,
        ),
      );
    } else {
      let shadowFilter = Skia.ImageFilter.MakeDropShadowOnly(
        0,
        convertToBaseCanvasRatio(4, width),
        convertToBaseCanvasRatio(8, width),
        convertToBaseCanvasRatio(8, width),
        Skia.Color('#00000099'),
        shadowImageFilter,
      );
      if (animateImageFilter) {
        shadowFilter = animateImageFilter(shadowFilter);
      }
      shadowPaint.setImageFilter(shadowFilter);
    }
    animatePaint?.(shadowPaint, overlayRect);
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

  if (animateImageFilter) {
    imageFilter = animateImageFilter(imageFilter);
  }

  const paint = Skia.Paint();
  paint.setImageFilter(imageFilter);
  animatePaint?.(paint, overlayRect);
  canvas.save();
  canvas.clipRRect(innerRect, ClipOp.Intersect, true);
  canvas.drawRRect(innerRect, paint);
  canvas.restore();

  if (borderWidth > 0) {
    const borderPaint = Skia.Paint();
    borderPaint.setColor(Skia.Color(swapColor(borderColor, cardColors)));
    animatePaint?.(borderPaint, overlayRect);
    canvas.drawDRRect(outerRect, innerRect, borderPaint);
  }
  canvas.restore();
};

export default coverOverlayDrawer;
