import { useIntl } from 'react-intl';
import fadeInOut from './fadeInOut';
import zoomInOpacity from './zoomInOpacity';
import zoomInOut from './zoomInOut';
import zoomOutIn from './zoomOutIn';
import zoomOutOpacity from './zoomOutOpacity';

const overlayAnimations = {
  fadeInOut,
  zoomInOpacity,
  zoomOutOpacity,
  zoomInOut,
  zoomOutIn,
} as const;

export type OverlayAnimations = keyof typeof overlayAnimations;

export type OverlayAnimationListItem = {
  label: string;
  id: OverlayAnimations;
};

export const useOverlayAnimationList = (): OverlayAnimationListItem[] => {
  const intl = useIntl();
  return [
    {
      id: 'fadeInOut',
      label: intl.formatMessage({
        defaultMessage: 'Zoom In',
        description: 'Cover Edition Overlay Animation - Fade In',
      }),
    },
    {
      id: 'zoomInOpacity',
      label: intl.formatMessage({
        defaultMessage: 'Zoom In with Opacity',
        description: 'Cover Edition Overlay Animation - Zoom In',
      }),
    },
    {
      id: 'zoomOutOpacity',
      label: intl.formatMessage({
        defaultMessage: 'Zoom Out with Opacity',
        description: 'Cover Edition Overlay Animation - Zoom Out',
      }),
    },
    {
      id: 'zoomInOut',
      label: intl.formatMessage({
        defaultMessage: 'Zoom In and Out',
        description: 'Cover Edition Overlay Animation - Zoom In and Out',
      }),
    },
    {
      id: 'zoomOutIn',
      label: intl.formatMessage({
        defaultMessage: 'Zoom Out and In',
        description: 'Cover Edition Overlay Animation - Zoom Out and In',
      }),
    },
  ] as const;
};

export default overlayAnimations;
