import { useIntl } from 'react-intl';
import fastZoomIn from './mediaAnimations/fastZoomIn';
import fastZoomOut from './mediaAnimations/fastZoomOut';
import jerkyIn from './mediaAnimations/jerkyIn';
import jerkyOut from './mediaAnimations/jerkyOut';
import linearZoomIn from './mediaAnimations/linearZoomIn';
import linearZoomOut from './mediaAnimations/linearZoomOut';
import smoothZoomIn from './mediaAnimations/smoothZoomIn';
import smoothZoomOut from './mediaAnimations/smoothZoomOut';
import softZoomIn from './mediaAnimations/softZoomIn';
import softZoomOut from './mediaAnimations/softZoomOut';
import type { SkMatrix } from '@shopify/react-native-skia';

export type ImageMediaAnimation = (args: {
  matrix: SkMatrix;
  duration: number;
  time: number;
  width: number;
  height: number;
}) => void;

const mediaAnimations = {
  [linearZoomIn.id]: linearZoomIn,
  [linearZoomOut.id]: linearZoomOut,
  [smoothZoomIn.id]: smoothZoomIn,
  [smoothZoomOut.id]: smoothZoomOut,
  [fastZoomIn.id]: fastZoomIn,
  [fastZoomOut.id]: fastZoomOut,
  [softZoomIn.id]: softZoomIn,
  [softZoomOut.id]: softZoomOut,
  [jerkyIn.id]: jerkyIn,
  [jerkyOut.id]: jerkyOut,
} as const;

export const useAnimationList = (): MediaAnimationListItem[] => {
  const intl = useIntl();
  return [
    {
      id: linearZoomIn.id,
      label: intl.formatMessage({
        defaultMessage: 'Zoom In',
        description: 'Cover Edition Media Image Animation - Linear Zoom In',
      }),
    },
    {
      id: linearZoomOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Zoom Out',
        description: 'Cover Edition Media Image Animation - Linear Zoom Out',
      }),
    },
    {
      id: smoothZoomIn.id,
      label: intl.formatMessage({
        defaultMessage: 'Smooth Zoom In',
        description: 'Cover Edition Media Image Animation - Smooth Zoom In',
      }),
    },
    {
      id: smoothZoomOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Smooth Zoom Out',
        description: 'Cover Edition Media Image Animation - Smooth Zoom Out',
      }),
    },
    {
      id: fastZoomIn.id,
      label: intl.formatMessage({
        defaultMessage: 'Fast Zoom In',
        description: 'Cover Edition Media Image Animation - Fast Zoom In',
      }),
    },
    {
      id: fastZoomOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Fast Zoom Out',
        description: 'Cover Edition Media Image Animation - Fast Zoom Out',
      }),
    },
    {
      id: softZoomIn.id,
      label: intl.formatMessage({
        defaultMessage: 'Soft Zoom In',
        description: 'Cover Edition Media Image Animation - Soft Zoom In',
      }),
    },
    {
      id: softZoomOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Soft Zoom Out',
        description: 'Cover Edition Media Image Animation - Soft Zoom Out',
      }),
    },
    {
      id: jerkyIn.id,
      label: intl.formatMessage({
        defaultMessage: 'Jerky Zoom In',
        description: 'Cover Edition Media Image Animation - Jerky Zoom In',
      }),
    },
    {
      id: jerkyOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Jerky Zoom Out',
        description: 'Cover Edition Media Image Animation - Jerky Zoom Out',
      }),
    },
  ] as const;
};

export default mediaAnimations;

export type MediaAnimations = keyof typeof mediaAnimations;

export type MediaAnimation = {
  id: MediaAnimations;
  animate: ImageMediaAnimation;
};

export type MediaAnimationListItem = {
  label: string;
  id: MediaAnimations;
};
