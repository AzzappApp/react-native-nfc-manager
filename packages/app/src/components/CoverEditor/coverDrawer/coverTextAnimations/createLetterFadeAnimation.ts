import { Skia } from '@shopify/react-native-skia';
import { Easing, interpolate } from 'react-native-reanimated';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  lettersExtractors,
  getSkFont,
  drawParagraphGlyphs,
  easeAppearDisappear,
} from '../coverDrawerHelpers';
import type { CoverTextAnimation } from './coverTextAnimations';

const createLetterFadeAnimation =
  (random: boolean): CoverTextAnimation =>
  ({ progress, paragraph, textLayer, canvas, canvasWidth, cardColors }) => {
    'worklet';

    progress = easeAppearDisappear(progress, Easing.inOut(Easing.ease));

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

    const paint = Skia.Paint();
    paint.setColor(Skia.Color(swapColor(color, cardColors)));

    letters.forEach((letter, index, { length }) => {
      let opacity = 0;
      if (random) {
        opacity = interpolate(
          progress,
          [0, Math.random() * 0.25, 1 - Math.random() * 0.25, 1],
          [0, 1, 1, 0],
        );
      } else {
        opacity = interpolate(
          progress,
          [0, ((index + 1) / length) * 0.25, 1 - (1 - index / length) * 0.2, 1],
          [0, 1, 1, 0],
        );
      }
      paint.setAlphaf(opacity);
      drawParagraphGlyphs(paragraph, font, [letter], paint, canvas);
    });
  };

export default createLetterFadeAnimation;
