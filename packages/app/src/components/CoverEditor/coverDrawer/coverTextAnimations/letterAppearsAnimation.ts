import { Skia } from '@shopify/react-native-skia';
import { interpolate } from 'react-native-reanimated';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  lettersExtractors,
  getSkFont,
  drawParagraphGlyphs,
} from '../coverDrawerHelpers';
import type { CoverTextAnimation } from './coverTextAnimations';

const letterAppearsAnimation: CoverTextAnimation = ({
  progress,
  paragraph,
  textLayer,
  canvas,
  canvasWidth,
  cardColors,
}) => {
  'worklet';

  const { text, fontFamily, color, fontSize, width: layerWidth } = textLayer;
  const textWidth = (layerWidth * canvasWidth) / 100;

  const font = getSkFont(fontFamily, fontSize, textWidth, canvasWidth);
  const letters = lettersExtractors(text, paragraph, font).filter(
    ({ letter }) => /\S/.test(letter),
  );

  if (!letters.length) {
    return;
  }

  canvas.translate(-textWidth / 2, -paragraph.getHeight() / 2);

  const displayedLetters = letters.slice(
    0,
    Math.round(
      interpolate(
        progress,
        [0, 0.25, 0.75, 1],
        [0, letters.length, letters.length, 0],
      ),
    ),
  );

  const paint = Skia.Paint();
  paint.setColor(Skia.Color(swapColor(color, cardColors)));

  drawParagraphGlyphs(paragraph, font, displayedLetters, paint, canvas);
};

export default letterAppearsAnimation;
