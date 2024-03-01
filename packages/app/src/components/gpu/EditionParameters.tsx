import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Platform } from 'react-native';
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
   * the amount of structure to apply to the image
   * @platform ios
   */
  structure?: number | null;
  /**
   * the amount of temperature to apply to the image
   */
  temperature?: number | null;
  /**
   * the amount of tint to apply to the image
   * @platform ios
   */
  tint?: number | null;
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
   * the amount of x centered rotation to apply to the image (in degrees)
   * @platform ios
   */
  pitch?: number | null;
  /**
   * the amount of z centered rotation to apply to the image (in degrees)
   */
  roll?: number | null;
  /**
   * the amount of y centered rotation to apply to the image (in degrees)
   * @platform ios
   */
  yaw?: number | null;
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

/**
 * Information about the parameters used by Controls UI
 */
export const editionParametersSettings: ParametersInfo<{
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  interval?: number;
  displayedValues?: [number, number];
  ios?: boolean;
  android?: boolean;
}> = {
  brightness: {
    defaultValue: 0,
    min: -0.5,
    max: 0.5,
    step: 0.025,
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
    defaultValue: 1,
    min: 0,
    max: 2,
    step: 0.025,
    displayedValues: [-100, 100],
    android: false,
    // highlights  works on iOS, but the behavior is strange
    // let's disable it for now
    ios: false,
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
    android: false,
    displayedValues: [-100, 100],
  },
  sharpness: {
    defaultValue: 0,
    min: -2,
    max: 2,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  structure: {
    defaultValue: 0,
    min: -2,
    max: 2,
    step: 0.05,
    android: false,
    displayedValues: [-100, 100],
  },
  temperature: {
    defaultValue: 6500,
    min: 2000,
    max: 11000,
    displayedValues: [-100, 100],
    step: 225,
  },
  tint: {
    defaultValue: 0,
    min: -150,
    max: 150,
    step: 5,
    displayedValues: [-100, 100],
    android: false,
  },
  vibrance: {
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.05,
    displayedValues: [-100, 100],
    android: false,
  },
  vignetting: {
    defaultValue: 0,
    min: 0,
    max: 2,
    displayedValues: [0, 100],
    step: 0.05,
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
      structure: {
        icon: 'structure',
        label: intl.formatMessage({
          defaultMessage: 'Structure',
          description: 'Structure image edition parameters name',
        }),
      },
      temperature: {
        icon: 'temperature',
        label: intl.formatMessage({
          defaultMessage: 'Warmth',
          description: 'Temperature/warmth image edition parameters name',
        }),
      },
      tint: {
        icon: 'tint',
        label: intl.formatMessage({
          defaultMessage: 'Tint',
          description: 'Tint image edition parameters name',
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

/**
 * A set of transforms values to apply to the parameters before sending them to the GPU
 * Used to adapt the values to the different platforms
 */
export const editionParametersTransforms: {
  [key in keyof EditionParameters]?: (
    value: NonNullable<EditionParameters[key]>,
  ) => NonNullable<EditionParameters[key]>;
} = {
  sharpness: Platform.select({
    default: value => value,
    android: value => (value > 0 ? value * 4 : value),
  }),
  vignetting: Platform.select({
    default: value => value,
    android: value => value / 3,
  }),
};
