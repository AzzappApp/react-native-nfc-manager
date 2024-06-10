import { Skia, TextAlign } from '@shopify/react-native-skia';
import { swapColor, type ColorPalette } from '@azzapp/shared/cardHelpers';
import { percentRectToRect } from '../coverEditorHelpers';
import { convertToBaseCanvasRatio } from './utils';
import type { CoverDrawerOptions } from './types';
import type { CoverEditorTextLayerItem } from '../coverEditorTypes';
import type {
  SkParagraph,
  SkTypefaceFontProvider,
} from '@shopify/react-native-skia';

const textAlignMap = {
  center: TextAlign.Center,
  justify: TextAlign.Justify,
  left: TextAlign.Left,
  right: TextAlign.Right,
};

export const createParagraph = ({
  layer,
  fontManager,
  canvasWidth,
  cardColors,
}: {
  layer: CoverEditorTextLayerItem;
  fontManager: SkTypefaceFontProvider | null;
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
  const textWidth = layerWidth * canvasWidth;

  const paragraph = Skia.ParagraphBuilder.Make(
    { textAlign: textAlignMap[textAlign ?? 'left'] },
    fontManager ?? Skia.TypefaceFontProvider.Make(),
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
  fontManager,
  width,
  height,
}: CoverDrawerOptions & { index: number }) => {
  'worklet';
  const layer = textLayers[index];
  if (!layer) {
    return;
  }
  const paragraph = createParagraph({
    layer,
    fontManager,
    canvasWidth: width,
    cardColors,
  });
  const { rotation, position, width: layerWidth } = layer;
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
  paragraph.paint(canvas, -textWidth / 2, -paragraph.getHeight() / 2);
  canvas.restore();
};

export default coverTextDrawer;
