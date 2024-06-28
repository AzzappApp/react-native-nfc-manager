import { FontWeight, Skia, FontSlant } from '@shopify/react-native-skia';
import { skiaFontManager } from '#hooks/useApplicationFonts';
import type {
  SkRRect,
  SkFont,
  SkParagraph,
  SkCanvas,
  SkPaint,
} from '@shopify/react-native-skia';
import type { EasingFunction } from 'react-native-reanimated';

export const convertToBaseCanvasRatio = (
  value: number,
  canvasWidth: number,
) => {
  'worklet';
  return value * (canvasWidth / 300);
};

export const inflateRRect = (
  rect: SkRRect,
  dx: number,
  dy: number,
  tx = 0,
  ty = 0,
) => {
  'worklet';
  return {
    rect: {
      x: rect.rect.x - dx + tx,
      y: rect.rect.y - dy + ty,
      width: rect.rect.width + 2 * dx,
      height: rect.rect.height + 2 * dy,
    },
    rx: rect.rx + dx,
    ry: rect.ry + dy,
  };
};

export const lettersExtractors = (
  text: string,
  paragraph: SkParagraph,
  font: SkFont,
) => {
  'worklet';
  const glyphs = font.getGlyphIDs(text);
  return text.split('').map((letter, index) => {
    'worklet';

    const rect = paragraph.getRectsForRange(index, index + 1)[0];

    return {
      letter,
      glyph: glyphs[index],
      position: {
        x: rect.x,
        y: rect.y,
      },
    };
  });
};

export const getSkFont = (
  fontFamily: string,
  fontSize: number,
  textWidth: number,
  canvasWidth: number,
) => {
  'worklet';
  const typeFace = skiaFontManager.matchFamilyStyle(fontFamily, {
    weight: FontWeight.Normal,
    slant: FontSlant.Upright,
    width: textWidth,
  });
  return Skia.Font(typeFace, convertToBaseCanvasRatio(fontSize, canvasWidth));
};

export const drawParagraphGlyphs = (
  paragraph: SkParagraph,
  font: SkFont,
  letters: ReturnType<typeof lettersExtractors>,
  paint: SkPaint,
  canvas: SkCanvas,
) => {
  'worklet';
  const fontMetrics = font.getMetrics();
  const firstLineMetrics = paragraph.getLineMetrics()[0];

  canvas.drawGlyphs(
    letters.map(({ glyph }) => glyph),
    letters.map(({ position: rect }) => rect),
    0,
    (firstLineMetrics ? firstLineMetrics.height : paragraph.getHeight()) -
      fontMetrics.descent,
    font,
    paint,
  );
};

export const easeAppearDisappear = (
  progress: number,
  easing: EasingFunction,
) => {
  'worklet';
  if (progress < 0.25) {
    progress = easing(progress * 4) / 4;
  } else if (progress > 0.75) {
    progress = 0.75 + easing((progress - 0.75) * 4) / 4;
  }
  return progress;
};
