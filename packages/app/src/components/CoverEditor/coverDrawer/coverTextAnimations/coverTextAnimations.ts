import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import createLetterFadeAnimation from './createLetterFadeAnimation';
import createSlideAnimation from './createSlideAnimation';
import createSlideLetterAnimation from './createSlideLetterAnimation';
import createSmoothAnimation from './createSmoothAnimation';
import createSmoothLetterAnimation from './createSmoothLetterAnimation';
import fadeInOut from './fadeInOut';
import letterAppearsAnimation from './letterAppearsAnimation';
import neon from './neon';
import type { CoverEditorTextLayerItem } from '#components/CoverEditor/coverEditorTypes';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { SkCanvas, SkParagraph } from '@shopify/react-native-skia';

export type CoverTextAnimation = (options: {
  progress: number;
  paragraph: SkParagraph;
  textLayer: CoverEditorTextLayerItem;
  canvas: SkCanvas;
  canvasWidth: number;
  canvasHeight: number;
  cardColors: ColorPalette;
}) => void;

const coverTextAnimations = {
  fadeInOut,
  neon,
  slideUp: createSlideAnimation('fromTop'),
  slideRight: createSlideAnimation('fromRight'),
  slideDown: createSlideAnimation('fromBottom'),
  slideLeft: createSlideAnimation('fromLeft'),
  smoothUp: createSmoothAnimation('fromTop'),
  smoothRight: createSmoothAnimation('fromRight'),
  smoothDown: createSmoothAnimation('fromBottom'),
  smoothLeft: createSmoothAnimation('fromLeft'),
  letterAppearsAnimation,
  letterFadeAnimation: createLetterFadeAnimation(false),
  letterFadeAnimationRandom: createLetterFadeAnimation(true),
  letterSlideFromTop: createSlideLetterAnimation('fromTop'),
  letterSlideFromRight: createSlideLetterAnimation('fromRight'),
  letterSlideFromBottom: createSlideLetterAnimation('fromBottom'),
  letterSlideFromLeft: createSlideLetterAnimation('fromLeft'),
  letterSmoothFromTop: createSmoothLetterAnimation('fromTop'),
  letterSmoothFromRight: createSmoothLetterAnimation('fromRight'),
  letterSmoothFromBottom: createSmoothLetterAnimation('fromBottom'),
  letterSmoothFromLeft: createSmoothLetterAnimation('fromLeft'),
} as const;

export type CoverTextAnimations = keyof typeof coverTextAnimations;

export type CoverTextAnimationListItem = {
  label: string;
  id: CoverTextAnimations;
};

export const useCoverTextAnimationList = () => {
  const intl = useIntl();
  const animations: CoverTextAnimationListItem[] = useMemo(
    () => [
      {
        id: 'fadeInOut',
        label: intl.formatMessage({
          defaultMessage: 'Fade',
          description: 'Cover Edition CoverText Animation - Fade',
        }),
      },
      {
        id: 'neon',
        label: intl.formatMessage({
          defaultMessage: 'Neon',
          description: 'Cover Edition CoverText Animation - Neon',
        }),
      },
      {
        id: 'slideUp',
        label: intl.formatMessage({
          defaultMessage: 'Slide up',
          description: 'Cover Edition CoverText Animation - Smooth up',
        }),
      },
      {
        id: 'slideRight',
        label: intl.formatMessage({
          defaultMessage: 'Slide right',
          description: 'Cover Edition CoverText Animation - Smooth right',
        }),
      },
      {
        id: 'slideDown',
        label: intl.formatMessage({
          defaultMessage: 'Slide down',
          description: 'Cover Edition CoverText Animation - Smooth down',
        }),
      },
      {
        id: 'slideLeft',
        label: intl.formatMessage({
          defaultMessage: 'Slide left',
          description: 'Cover Edition CoverText Animation - Smooth left',
        }),
      },
      {
        id: 'smoothUp',
        label: intl.formatMessage({
          defaultMessage: 'Smooth up',
          description: 'Cover Edition CoverText Animation - Smooth up',
        }),
      },
      {
        id: 'smoothRight',
        label: intl.formatMessage({
          defaultMessage: 'Smooth right',
          description: 'Cover Edition CoverText Animation - Smooth right',
        }),
      },
      {
        id: 'smoothDown',
        label: intl.formatMessage({
          defaultMessage: 'Smooth down',
          description: 'Cover Edition CoverText Animation - Smooth down',
        }),
      },
      {
        id: 'smoothLeft',
        label: intl.formatMessage({
          defaultMessage: 'Smooth left',
          description: 'Cover Edition CoverText Animation - Smooth left',
        }),
      },
      {
        id: 'letterAppearsAnimation',
        label: intl.formatMessage({
          defaultMessage: 'Letter appears',
          description: 'Cover Edition CoverText Animation - Letter appears',
        }),
      },
      {
        id: 'letterFadeAnimation',
        label: intl.formatMessage({
          defaultMessage: 'Letter fade',
          description: 'Cover Edition CoverText Animation - Letter appears',
        }),
      },
      {
        id: 'letterFadeAnimationRandom',
        label: intl.formatMessage({
          defaultMessage: 'Letter fade randomly',
          description: 'Cover Edition CoverText Animation - Letter appears',
        }),
      },
      {
        id: 'letterSlideFromTop',
        label: intl.formatMessage({
          defaultMessage: 'Letter Slide from top',
          description: 'Cover Edition CoverText Animation - Slide from top',
        }),
      },
      {
        id: 'letterSlideFromRight',
        label: intl.formatMessage({
          defaultMessage: 'Letter Slide from right',
          description: 'Cover Edition CoverText Animation - Slide from right',
        }),
      },
      {
        id: 'letterSlideFromBottom',
        label: intl.formatMessage({
          defaultMessage: 'Letter Slide from bottom',
          description: 'Cover Edition CoverText Animation - Slide from bottom',
        }),
      },
      {
        id: 'letterSlideFromLeft' as const,
        label: intl.formatMessage({
          defaultMessage: 'Letter Slide from left',
          description: 'Cover Edition CoverText Animation - Slide from left',
        }),
      },
      {
        id: 'letterSmoothFromTop' as const,
        label: intl.formatMessage({
          defaultMessage: 'Letter Smooth from top',
          description: 'Cover Edition CoverText Animation - Smooth from top',
        }),
      },
      {
        id: 'letterSmoothFromRight',
        label: intl.formatMessage({
          defaultMessage: 'Letter Smooth from right',
          description: 'Cover Edition CoverText Animation - Smooth from right',
        }),
      },
      {
        id: 'letterSmoothFromBottom',
        label: intl.formatMessage({
          defaultMessage: 'Letter Smooth from bottom',
          description: 'Cover Edition CoverText Animation - Smooth from bottom',
        }),
      },
      {
        id: 'letterSmoothFromLeft',
        label: intl.formatMessage({
          defaultMessage: 'Letter Smooth from left',
          description: 'Cover Edition CoverText Animation - Smooth from left',
        }),
      },
    ],
    [intl],
  );

  return animations;
};

export default coverTextAnimations;
