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
import type { CoverLayerAnimation } from '../coverEditorTypes';

//we can use direclty matrix animation for now. update if we are merging matrix and shader animation
const mediaAnimations = {
  [linearZoomIn.id]: { ...linearZoomIn, animateShader: null },
  [linearZoomOut.id]: { ...linearZoomOut, animateShader: null },
  [smoothZoomIn.id]: { ...smoothZoomIn, animateShader: null },
  [smoothZoomOut.id]: { ...smoothZoomOut, animateShader: null },
  [fastZoomIn.id]: { ...fastZoomIn, animateShader: null },
  [fastZoomOut.id]: { ...fastZoomOut, animateShader: null },
  [softZoomIn.id]: { ...softZoomIn, animateShader: null },
  [softZoomOut.id]: { ...softZoomOut, animateShader: null },
  [jerkyIn.id]: { ...jerkyIn, animateShader: null },
  [jerkyOut.id]: { ...jerkyOut, animateShader: null },
} as const;

export const useMediaAnimationList = (): MediaAnimationListItem[] => {
  const intl = useIntl();
  return [
    {
      id: linearZoomIn.id,
      label: intl.formatMessage({
        defaultMessage: 'Zoom In',
        description: 'Cover Edition Matrix Image Animation - Linear Zoom In',
      }),
    },
    {
      id: linearZoomOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Zoom Out',
        description: 'Cover Edition Matrix Image Animation - Linear Zoom Out',
      }),
    },
    {
      id: smoothZoomIn.id,
      label: intl.formatMessage({
        defaultMessage: 'Smooth Zoom In',
        description: 'Cover Edition Matrix Image Animation - Smooth Zoom In',
      }),
    },
    {
      id: smoothZoomOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Smooth Zoom Out',
        description: 'Cover Edition Matrix Image Animation - Smooth Zoom Out',
      }),
    },
    {
      id: fastZoomIn.id,
      label: intl.formatMessage({
        defaultMessage: 'Fast Zoom In',
        description: 'Cover Edition Matrix Image Animation - Fast Zoom In',
      }),
    },
    {
      id: fastZoomOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Fast Zoom Out',
        description: 'Cover Edition Matrix Image Animation - Fast Zoom Out',
      }),
    },
    {
      id: softZoomIn.id,
      label: intl.formatMessage({
        defaultMessage: 'Soft Zoom In',
        description: 'Cover Edition Matrix Image Animation - Soft Zoom In',
      }),
    },
    {
      id: softZoomOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Soft Zoom Out',
        description: 'Cover Edition Matrix Image Animation - Soft Zoom Out',
      }),
    },
    {
      id: jerkyIn.id,
      label: intl.formatMessage({
        defaultMessage: 'Jerky Zoom In',
        description: 'Cover Edition Matrix Image Animation - Jerky Zoom In',
      }),
    },
    {
      id: jerkyOut.id,
      label: intl.formatMessage({
        defaultMessage: 'Jerky Zoom Out',
        description: 'Cover Edition Matrix Image Animation - Jerky Zoom Out',
      }),
    },
  ] as const;
};

export default mediaAnimations;

export type MediaAnimations = keyof typeof mediaAnimations;

export type MediaAnimation = CoverLayerAnimation & {
  id: MediaAnimations;
};

export type MediaAnimationListItem = {
  label: string;
  id: MediaAnimations;
};
