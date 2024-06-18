import { useIntl } from 'react-intl';
import fadeInOut from './overlayAnimations/fadeInOut';
import zoomInOpacity from './overlayAnimations/zoomInOpacity';
import zoomInOut from './overlayAnimations/zoomInOut';
import zoomOutIn from './overlayAnimations/zoomOutIn';
import zoomOutOpacity from './overlayAnimations/zoomOutOpacity';
import type { CoverLayerAnimation } from '../coverEditorTypes';

const overlayAnimations = {
  [fadeInOut.id]: { ...fadeInOut, animateMatrix: null },
  [zoomInOpacity.id]: zoomInOpacity,
  [zoomOutOpacity.id]: zoomOutOpacity,
  [zoomInOut.id]: zoomInOut,
  [zoomOutIn.id]: zoomOutIn,
} as const;

export const useOverlayAnimationList = (): OverlayAnimationListItem[] => {
  const intl = useIntl();
  return [
    {
      id: fadeInOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Zoom In',
        description: 'Cover Edition Overlay Animation - Fade In',
      }),
    },
    {
      id: zoomInOpacity.id,
      label: intl.formatMessage({
        defaultMessage: 'Zoom In with Opacity',
        description: 'Cover Edition Overlay Animation - Zoom In',
      }),
    },
    {
      id: zoomOutOpacity.id,
      label: intl.formatMessage({
        defaultMessage: 'Zoom Out with Opacity',
        description: 'Cover Edition Overlay Animation - Zoom Out',
      }),
    },
    {
      id: zoomInOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Zoom In and Out',
        description: 'Cover Edition Overlay Animation - Zoom In and Out',
      }),
    },
    {
      id: zoomOutIn.id,
      label: intl.formatMessage({
        defaultMessage: 'Zoom Out and In',
        description: 'Cover Edition Overlay Animation - Zoom Out and In',
      }),
    },
  ] as const;
};

export default overlayAnimations;

export type OverlayAnimations = keyof typeof overlayAnimations;

export type OverlayAnimation = CoverLayerAnimation & { id: OverlayAnimations };

export type OverlayAnimationListItem = {
  label: string;
  id: OverlayAnimations;
};
