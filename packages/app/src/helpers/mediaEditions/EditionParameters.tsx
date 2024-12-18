import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import type { Icons } from '#ui/Icon';

/**
 * The parameters that can be used to edit the image/video
 * Displayed by a GPULayer
 */
export type EditionParameters = {
  /**
   * the amount of brightness to apply to the image
   */
  brightness?: number | null;
  /**
   * the amount of contrast to apply to the image
   */
  contrast?: number | null;
  /**
   * the amount of highlights to apply to the image iOS only
   * @platform ios
   */
  highlights?: number | null;
  /**
   * the amount of saturation to apply to the image
   */
  saturation?: number | null;
  /**
   * the amount of shadow to apply to the image
   * @platform ios
   */
  shadow?: number | null;
  /**
   * the amount of sharpness to apply to the image
   */
  sharpness?: number | null;
  /**
   * the amount of temperature to apply to the image
   */
  temperature?: number | null;
  /**
   * the amount of vibrance to apply to the image
   * @platform ios
   */
  vibrance?: number | null;
  /**
   * the amount of vignetting to apply to the image
   */
  vignetting?: number | null;
  /**
   * the amount of z centered rotation to apply to the image (in degrees)
   */
  roll?: number | null;
  /**
   * the crop applied to the image
   */
  cropData?: CropData | null;
  /**
   * the orientation change applied to the image
   */
  orientation?: ImageOrientation | null;
};

/**
 * Crop information for an image or video
 */
export type CropData = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

export const KNOWN_ORIENTATIONS = ['DOWN', 'LEFT', 'RIGHT', 'UP'] as const;

/**
 * The orientation of an image or video
 */
export type ImageOrientation = (typeof KNOWN_ORIENTATIONS)[number];

export type ParametersSettings = {
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  interval?: number;
  displayedValues?: [number, number];
  ios?: boolean;
  android?: boolean;
};

/**
 * Information about the parameters used by Controls UI
 */
export const editionParametersSettings: ParametersInfo<ParametersSettings> = {
  brightness: {
    defaultValue: 0,
    min: -0.25,
    max: 0.25,
    step: 0.01,
    displayedValues: [-100, 100],
  },
  contrast: {
    defaultValue: 1,
    min: 0.5,
    max: 1.5,
    step: 0.025,
    displayedValues: [-100, 100],
  },
  highlights: {
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  saturation: {
    defaultValue: 1,
    min: 0,
    max: 2,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  shadow: {
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  sharpness: {
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  temperature: {
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  vibrance: {
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  vignetting: {
    defaultValue: 0,
    min: 0,
    max: 1,
    step: 0.02,
    displayedValues: [0, 100],
  },
  roll: {
    defaultValue: 0,
    min: -20,
    max: 20,
    step: 1,
    displayedValues: [-20, 20],
  },
};

type ParametersInfo<T> = Partial<Record<keyof EditionParameters, T>>;

/**
 * Localized information about the parameters used by Controls UI
 */
export const useEditionParametersDisplayInfos = (): ParametersInfo<{
  label: string;
  icon: Icons;
}> => {
  const intl = useIntl();
  return useMemo(
    () => ({
      cropData: {
        icon: 'crop',
        label: intl.formatMessage({
          defaultMessage: 'Crop',
          description: 'Crop image edition parameters name',
        }),
      },
      brightness: {
        icon: 'brightness',
        label: intl.formatMessage({
          defaultMessage: 'Brightness',
          description: 'Brightness image edition parameters name',
        }),
      },
      contrast: {
        icon: 'contrast',
        label: intl.formatMessage({
          defaultMessage: 'Contrast',
          description: 'Contrast image edition parameters name',
        }),
      },
      highlights: {
        icon: 'brightness',
        label: intl.formatMessage({
          defaultMessage: 'Highlights',
          description: 'Highlights image edition parameters name',
        }),
      },
      saturation: {
        icon: 'saturation',
        label: intl.formatMessage({
          defaultMessage: 'Saturation',
          description: 'Saturation image edition parameters name',
        }),
      },
      shadow: {
        icon: 'shadow',
        label: intl.formatMessage({
          defaultMessage: 'Shadow',
          description: 'Shadow image edition parameters name',
        }),
      },
      sharpness: {
        icon: 'sharpness',
        label: intl.formatMessage({
          defaultMessage: 'Sharpness',
          description: 'Sharpness image edition parameters name',
        }),
      },
      temperature: {
        icon: 'temperature',
        label: intl.formatMessage({
          defaultMessage: 'Warmth',
          description: 'Temperature/warmth image edition parameters name',
        }),
      },
      vibrance: {
        icon: 'vibrance',
        label: intl.formatMessage({
          defaultMessage: 'Vibrance',
          description: 'Vibrance image edition parameters name',
        }),
      },
      vignetting: {
        icon: 'vignetting',
        label: intl.formatMessage({
          defaultMessage: 'Vignette',
          description: 'Vignette image edition parameters name',
        }),
      },
    }),
    [intl],
  );
};
