import { Skia, TextAlign } from '@shopify/react-native-skia';
import { interpolate } from 'react-native-reanimated';
import { swapColor, type ColorPalette } from '@azzapp/shared/cardHelpers';
import { skiaFontManager } from '#hooks/useApplicationFonts';
import { percentRectToRect } from '../coverEditorHelpers';
import { convertToBaseCanvasRatio } from './coverDrawerHelpers';
import coverTextAnimations from './coverTextAnimations';
import type { CoverDrawerOptions } from './coverDrawerTypes';
import type { CoverEditorTextLayerItem } from '../coverEditorTypes';
import type { SkParagraph } from '@shopify/react-native-skia';

const textAlignMap = {
  center: TextAlign.Center,
  justify: TextAlign.Justify,
  left: TextAlign.Left,
  right: TextAlign.Right,
};

export const createParagraph = ({
  layer,
  canvasWidth,
  cardColors,
}: {
  layer: CoverEditorTextLayerItem;
  canvasWidth: number;
  cardColors?: ColorPalette | null;
}): SkParagraph => {
  'worklet';
  const {
    text,
    textAlign,
    fontFamily,
    fontSize,
    color,
    shadow,
    width: layerWidth,
  } = layer;
  const textWidth = (layerWidth * canvasWidth) / 100;

  const paragraph = Skia.ParagraphBuilder.Make(
    { textAlign: textAlignMap[textAlign ?? 'left'] },
    skiaFontManager,
  )
    .pushStyle({
      fontFamilies: [fontFamily],
      fontSize: convertToBaseCanvasRatio(fontSize, canvasWidth),
      color: Skia.Color(swapColor(color, cardColors) ?? '#000000'),
      shadows: shadow
        ? [
            {
              color: Skia.Color('#00000099'),
              offset: { x: 0, y: convertToBaseCanvasRatio(4, canvasWidth) },
              blurRadius: convertToBaseCanvasRatio(8, canvasWidth),
            },
          ]
        : [],
    })
    .addText(text)
    .build();

  paragraph.layout(textWidth);
  return paragraph;
};

const coverTextDrawer = ({
  canvas,
  coverEditorState: { textLayers, cardColors },
  index,
  width,
  height,
  currentTime,
  videoComposition: { duration },
}: CoverDrawerOptions & { index: number }) => {
  'worklet';
  const layer = textLayers[index];
  if (!layer) {
    return;
  }
  const {
    rotation,
    position,
    width: layerWidth,
    animation: animationName,
    startPercentageTotal,
    endPercentageTotal,
  } = layer;

  if (
    currentTime < startPercentageTotal * duration ||
    currentTime > endPercentageTotal * duration
  ) {
    return;
  }
  const paragraph = createParagraph({
    layer,
    canvasWidth: width,
    cardColors,
  });
  const {
    x,
    y,
    width: textWidth,
  } = percentRectToRect(
    {
      ...position,
      width: layerWidth,
      height: 0,
    },
    width,
    height,
  );

  canvas.save();
  canvas.translate(x, y);
  if (rotation) {
    canvas.rotate((rotation * 180) / Math.PI, 0, 0);
  }

  const animation = animationName ? coverTextAnimations[animationName] : null;
  if (animation) {
    const progress = interpolate(
      currentTime,
      [
        startPercentageTotal * duration,
        endPercentageTotal * duration,
        duration,
      ],
      [0, 1],
    );
    animation({
      progress,
      paragraph,
      textLayer: layer,
      canvas,
      canvasWidth: width,
      canvasHeight: height,
      cardColors,
    });
  } else {
    paragraph.paint(canvas, -textWidth / 2, -paragraph.getHeight() / 2);
  }

  canvas.restore();
};

export default coverTextDrawer;
