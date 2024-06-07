import { useIntl } from 'react-intl';
import linearZoomIn from './mediaAnimations/linearZoomIn';
import linearZoomInOut from './mediaAnimations/linearZoomInOut';
import linearZoomOut from './mediaAnimations/linearZoomOut';
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
  [linearZoomInOut.id]: linearZoomInOut,
} as const;

export const useAnimationList = (): MediaAnimationListItem[] => {
  const intl = useIntl();
  return [
    {
      id: linearZoomIn.id,
      label: intl.formatMessage({
        defaultMessage: 'Linear Zoom In',
        description: 'Cover Edition Media Image Animation - Linear Zoom In',
      }),
    },
    {
      id: linearZoomOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Linear Zoom Out',
        description: 'Cover Edition Media Image Animation - Linear Zoom Out',
      }),
    },
    {
      id: linearZoomInOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Linear Zoom In Out',
        description: 'Cover Edition Media Image Animation - Linear Zoom In Out',
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
