import { useIntl } from 'react-intl';

const ANIMATORS: Record<string, () => null> = {
  none: () => null,
  smoothZoomOut: () => null,
  linearZoomOut: () => null,
  appearZoomOut: () => null,
  smoothZoomIn: () => null,
  linearZoomIn: () => null,
  appearZoomIn: () => null,
  fadeInOut: () => null,
  pop: () => null,
  rotate: () => null,
} as const;

export type MEDIA_ANIMATIONS = keyof typeof ANIMATORS;

export type Animation = {
  id: MEDIA_ANIMATIONS;
  start: number;
  duration: number;
};

export const useOrdonedAnimation = (): Array<{
  id: MEDIA_ANIMATIONS;
  label: string;
}> => {
  const intl = useIntl();
  return [
    {
      id: 'none',
      label: intl.formatMessage({
        defaultMessage: 'None',
        description: 'Cover Edition Animation - None',
      }),
    },
    {
      id: 'smoothZoomOut',
      label: intl.formatMessage({
        defaultMessage: 'Smooth Zoom Out',
        description: 'Cover Edition Animation - Smooth Zoom Out',
      }),
    },
    {
      id: 'linearZoomOut',
      label: intl.formatMessage({
        defaultMessage: 'Linear Zoom Out',
        description: 'Cover Edition Animation - Linear Zoom Out',
      }),
    },
    {
      id: 'appearZoomOut',
      label: intl.formatMessage({
        defaultMessage: 'Appear Zoom Out',
        description: 'Cover Edition Animation - Appear Zoom Out',
      }),
    },
    {
      id: 'smoothZoomIn',
      label: intl.formatMessage({
        defaultMessage: 'Smooth Zoom In',
        description: 'Cover Edition Animation - Smooth Zoom In',
      }),
    },
    {
      id: 'linearZoomIn',
      label: intl.formatMessage({
        defaultMessage: 'Linear Zoom In',
        description: 'Cover Edition Animation - Linear Zoom In',
      }),
    },
    {
      id: 'appearZoomIn',
      label: intl.formatMessage({
        defaultMessage: 'Zoom In',
        description: 'Cover Edition Animation - Appear Zoom In',
      }),
    },
    {
      id: 'fadeInOut',
      label: intl.formatMessage({
        defaultMessage: 'Fade In',
        description: 'Cover Edition Animation - Fade In',
      }),
    },
    {
      id: 'pop',
      label: intl.formatMessage({
        defaultMessage: 'Pop',
        description: 'Cover Edition Animation - Pop',
      }),
    },
    {
      id: 'rotate',
      label: intl.formatMessage({
        defaultMessage: 'Rotate',
        description: 'Cover Edition Animation - Rotate',
      }),
    },
  ] as const;
};
