import { Skia, TextAlign } from '@shopify/react-native-skia';
import { percentRectToRect } from '../coverEditorHelpers';
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

export const createParagraph = (
  layer: CoverEditorTextLayerItem,
  fontManager: SkTypefaceFontProvider | null,
  canvasWidth: number,
): SkParagraph => {
  'worklet';
  const { text, style, width: layerWidth } = layer;
  const textWidth = layerWidth * canvasWidth;
  const paragraph = Skia.ParagraphBuilder.Make(
    { textAlign: textAlignMap[style.textAlign ?? 'left'] },
    fontManager ?? Skia.TypefaceFontProvider.Make(),
  )
    .pushStyle({
      fontFamilies: [style.fontFamily],
      fontSize: style.fontSize * (canvasWidth / 300),
      color: Skia.Color(style.color ?? '#000000'),
    })
    .addText(text)
    .build();

  paragraph.layout(textWidth);
  return paragraph;
};

const coverTextDrawer = ({
  canvas,
  coverEditorState: { textLayers },
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
  const paragraph = createParagraph(layer, fontManager, width);
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
    canvas.rotate(
      (rotation * 180) / Math.PI,
      textWidth / 2,
      paragraph.getHeight() / 2,
    );
  }
  paragraph.paint(canvas, 0, 0);
  canvas.restore();
};

export default coverTextDrawer;
