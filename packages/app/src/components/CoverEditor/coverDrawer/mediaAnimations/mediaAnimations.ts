import { useIntl } from 'react-intl';
import fastZoomIn from './fastZoomIn';
import fastZoomOut from './fastZoomOut';
import jerkyIn from './jerkyIn';
import jerkyOut from './jerkyOut';
import linearZoomIn from './linearZoomIn';
import linearZoomOut from './linearZoomOut';
import smoothZoomIn from './smoothZoomIn';
import smoothZoomOut from './smoothZoomOut';
import softZoomIn from './softZoomIn';
import softZoomOut from './softZoomOut';
import type { ImageInfo } from '#helpers/mediaEditions';

export type MediaAnimation = (
  progress: number,
) => (imageInfo: ImageInfo) => ImageInfo;

//we can use direclty matrix animation for now. update if we are merging matrix and shader animation
const mediaAnimations = {
  linearZoomIn,
  linearZoomOut,
  smoothZoomIn,
  smoothZoomOut,
  fastZoomIn,
  fastZoomOut,
  softZoomIn,
  softZoomOut,
  jerkyIn,
  jerkyOut,
} as const;

export type MediaAnimations = keyof typeof mediaAnimations;

export type MediaAnimationListItem = {
  id: MediaAnimations;
  label: string;
};

export const useMediaAnimationList = (): MediaAnimationListItem[] => {
  const intl = useIntl();
  return [
    {
      id: 'linearZoomIn',
      label: intl.formatMessage({
        defaultMessage: 'Zoom In',
        description: 'Cover Edition Matrix Image Animation - Linear Zoom In',
      }),
    },
    {
      id: 'linearZoomOut',
      label: intl.formatMessage({
        defaultMessage: 'Zoom Out',
        description: 'Cover Edition Matrix Image Animation - Linear Zoom Out',
      }),
    },
    {
      id: 'smoothZoomIn',
      label: intl.formatMessage({
        defaultMessage: 'Smooth Zoom In',
        description: 'Cover Edition Matrix Image Animation - Smooth Zoom In',
      }),
    },
    {
      id: 'smoothZoomOut',
      label: intl.formatMessage({
        defaultMessage: 'Smooth Zoom Out',
        description: 'Cover Edition Matrix Image Animation - Smooth Zoom Out',
      }),
    },
    {
      id: 'fastZoomIn',
      label: intl.formatMessage({
        defaultMessage: 'Fast Zoom In',
        description: 'Cover Edition Matrix Image Animation - Fast Zoom In',
      }),
    },
    {
      id: 'fastZoomOut',
      label: intl.formatMessage({
        defaultMessage: 'Fast Zoom Out',
        description: 'Cover Edition Matrix Image Animation - Fast Zoom Out',
      }),
    },
    {
      id: 'softZoomIn',
      label: intl.formatMessage({
        defaultMessage: 'Soft Zoom In',
        description: 'Cover Edition Matrix Image Animation - Soft Zoom In',
      }),
    },
    {
      id: 'softZoomOut',
      label: intl.formatMessage({
        defaultMessage: 'Soft Zoom Out',
        description: 'Cover Edition Matrix Image Animation - Soft Zoom Out',
      }),
    },
    {
      id: 'jerkyIn',
      label: intl.formatMessage({
        defaultMessage: 'Jerky Zoom In',
        description: 'Cover Edition Matrix Image Animation - Jerky Zoom In',
      }),
    },
    {
      id: 'jerkyOut',
      label: intl.formatMessage({
        defaultMessage: 'Jerky Zoom Out',
        description: 'Cover Edition Matrix Image Animation - Jerky Zoom Out',
      }),
    },
  ] as const;
};

export default mediaAnimations;
