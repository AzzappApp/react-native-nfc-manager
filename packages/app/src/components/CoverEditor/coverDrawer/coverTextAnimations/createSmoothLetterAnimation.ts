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

const createSmoothLetterAnimation =
  (
    slideDirection: 'fromBottom' | 'fromLeft' | 'fromRight' | 'fromTop',
  ): CoverTextAnimation =>
  ({ progress, paragraph, textLayer, canvas, canvasWidth, cardColors }) => {
    'worklet';

    progress = easeAppearDisappear(progress, Easing.inOut(Easing.ease));

    const { text, fontFamily, color, fontSize, width: layerWidth } = textLayer;
    const textWidth = (layerWidth * canvasWidth) / 100;

    const deltaX =
      slideDirection === 'fromLeft'
        ? -textWidth
        : slideDirection === 'fromRight'
          ? textWidth
          : 0;

    const deltaY =
      slideDirection === 'fromTop'
        ? -paragraph.getHeight()
        : slideDirection === 'fromBottom'
          ? paragraph.getHeight()
          : 0;

    const font = getSkFont(fontFamily, fontSize, textWidth, canvasWidth);
    const letters = lettersExtractors(text, paragraph, font)
      .filter(({ letter }) => /\S/.test(letter))
      .map(({ letter, glyph, position }, index, { length }) => {
        const letterAnimationPosition =
          slideDirection === 'fromRight' || slideDirection === 'fromBottom'
            ? ((index + 1) / length) * 0.25
            : (1 - index / length) * 0.25;
        const letterAnimationProgress = interpolate(
          progress,
          [0, letterAnimationPosition, 1 - letterAnimationPosition, 1],
          [0, 1, 1, 1],
        );
        return {
          letter,
          glyph,
          position: {
            x: position.x + deltaX - letterAnimationProgress * deltaX,
            y: position.y + deltaY - letterAnimationProgress * deltaY,
          },
        };
      });

    if (!letters.length) {
      return;
    }

    canvas.translate(-textWidth / 2, -paragraph.getHeight() / 2);

    const paint = Skia.Paint();
    paint.setColor(Skia.Color(swapColor(color, cardColors)));

    letters.forEach((letter, index, { length }) => {
      const letterAnimationPosition = ((index + 1) / length) * 0.25;
      const opacity = interpolate(
        Easing.inOut(Easing.ease)(progress),
        [0, letterAnimationPosition, 0.75, 1],
        [0, 1, 1, 0],
      );
      paint.setAlphaf(opacity);
      drawParagraphGlyphs(paragraph, font, [letter], paint, canvas);
    });
  };

export default createSmoothLetterAnimation;
