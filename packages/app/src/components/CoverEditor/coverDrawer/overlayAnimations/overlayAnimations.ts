import { useIntl } from 'react-intl';
import fadeInOut from './fadeInOut';
import zoomInOpacity from './zoomInOpacity';
import zoomInOut from './zoomInOut';
import zoomOutInOpacity from './zoomOutInOpacity';
import zoomOutOpacity from './zoomOutOpacity';
import type {
  SkCanvas,
  SkImageFilter,
  SkPaint,
  SkRect,
} from '@shopify/react-native-skia';

export type PaintAnimation = (paint: SkPaint, rect: SkRect) => void;

export type CanvasAnimation = (canvas: SkCanvas, rect: SkRect) => void;

export type ImageFilterAnimation = (
  imageFilter: SkImageFilter,
) => SkImageFilter;

export type OverlayAnimation = (progress: number) => {
  animatePaint?: PaintAnimation;
  animateCanvas?: CanvasAnimation;
  animateImageFilter?: ImageFilterAnimation;
};

const overlayAnimations = {
  fadeInOut,
  zoomInOpacity,
  zoomOutOpacity,
  zoomInOut,
  zoomOutInOpacity,
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
        defaultMessage: 'Fade',
        description: 'Cover Edition Overlay Animation - Fade',
      }),
    },
    {
      id: 'zoomInOpacity',
      label: intl.formatMessage({
        defaultMessage: 'Zoom In',
        description: 'Cover Edition Overlay Animation - Zoom In',
      }),
    },
    {
      id: 'zoomOutOpacity',
      label: intl.formatMessage({
        defaultMessage: 'Zoom Out',
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
      id: 'zoomOutInOpacity',
      label: intl.formatMessage({
        defaultMessage: 'Zoom Out and In',
        description: 'Cover Edition Overlay Animation - Zoom Out and In',
      }),
    },
  ] as const;
};

export default overlayAnimations;
