/* eslint-disable @typescript-eslint/no-var-requires */
// TODO refactor this file quite messy
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Image } from 'react-native';
import type { Icons } from '#ui/Icon';
import type { EditionParameters } from './GPULayers';
import type { ImageSourcePropType } from 'react-native';

type ParametersInfo<T> = Partial<Record<keyof EditionParameters, T>>;

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
        kind: 'slider',
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

export const editionParametersSettings: ParametersInfo<{
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  interval?: number;
  displayedValues?: [number, number];
}> = {
  brightness: {
    defaultValue: 0,
    min: -0.5,
    max: 0.5,
    step: 0.025,
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
    max: 1,
    step: 0.025,
    displayedValues: [-100, 100],
  },
  saturation: {
    defaultValue: 1,
    min: 0,
    max: 2,
    step: 0.05,
    displayedValues: [-100, 100],
  },
  shadow: { defaultValue: 0, min: -1, max: 1, step: 0.05 },
  sharpness: { defaultValue: 0, min: -2, max: 2, step: 0.05 },
  structure: { defaultValue: 0, min: -2, max: 2, step: 0.05 },
  temperature: {
    defaultValue: 6500,
    min: 2000,
    max: 11000,
    step: 225,
    displayedValues: [-100, 100],
  },
  tint: { defaultValue: 0, min: -150, max: 150, step: 5 },
  vibrance: { defaultValue: 0, min: -1, max: 1, step: 0.05 },
  vignetting: { defaultValue: 0, min: -2, max: 2, step: 0.05 },
  roll: {
    defaultValue: 0,
    min: -20,
    max: 20,
    step: 1,
  },
};

const getUri = (source: ImageSourcePropType) =>
  // question mark for jest
  Image.resolveAssetSource(source)?.uri;

export const FILTERS = {
  'black-and-white': getUri(require('./assets/luts/black-and-white.png')),
  eterna: getUri(require('./assets/luts/eterna.png')),
  'deep-south': getUri(require('./assets/luts/deep-south.png')),
  'gold-dust': getUri(require('./assets/luts/gold-dust.png')),
} as const;

export type Filter = keyof typeof FILTERS;

export const isFilter = (filter?: string | null): filter is Filter =>
  !!(FILTERS as any)[filter as Filter];

export const useFilterLabels = (): Record<Filter, string> => {
  const intl = useIntl();
  return useMemo(
    () => ({
      'black-and-white': intl.formatMessage({
        defaultMessage: 'Black & White',
        description: 'Black & White photo filter name',
      }),
      eterna: intl.formatMessage({
        defaultMessage: 'Eterna',
        description: 'Eterna photo filter name',
      }),
      'deep-south': intl.formatMessage({
        defaultMessage: 'Deep South',
        description: 'Deep South photo filter name',
      }),
      'gold-dust': intl.formatMessage({
        defaultMessage: 'Gold Dust',
        description: 'Gold Dust photo filter name',
      }),
    }),
    [intl],
  );
};
