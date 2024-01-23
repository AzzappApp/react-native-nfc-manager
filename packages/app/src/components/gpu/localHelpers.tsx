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
      // highlights: {
      //   icon: 'brightness',
      //   label: intl.formatMessage({
      //     defaultMessage: 'Highlights',
      //     description: 'Highlights image edition parameters name',
      //   }),
      //   kind: 'slider',
      // },
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
  // highlights: {
  //   defaultValue: 1,
  //   min: 0,
  //   max: 1,
  //   step: 0.025,
  //   displayedValues: [-100, 100],
  // },
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
  nah: getUri(require('./assets/nah.png')),
  once: getUri(require('./assets/once.png')),
  passing_by: getUri(require('./assets/passing_by.png')),
  serenity: getUri(require('./assets/serenity.png')),
  solar: getUri(require('./assets/solar.png')),
  undeniable: getUri(require('./assets/undeniable.png')),
  undeniable2: getUri(require('./assets/undeniable2.png')),
  you_can_do_it: getUri(require('./assets/you_can_do_it.png')),
  pure: getUri(require('./assets/pure.png')),
  syrah: getUri(require('./assets/syrah.png')),
  paper: getUri(require('./assets/paper.png')),
  rock: getUri(require('./assets/rock.png')),
  vouzon: getUri(require('./assets/vouzon.png')),
  // BIG UP @mlecoq
  transparency: getUri(require('./assets/transparency.png')),
  autumn: getUri(require('./assets/autumn.png')),
  one_of_us: getUri(require('./assets/one_of_us.png')),
  bourbon: getUri(require('./assets/bourbon.png')),
  black_and_white_light: getUri(require('./assets/black_and_white_light.png')),
  black_and_white_neutral: getUri(
    require('./assets/black_and_white_neutral.png'),
  ),
  black_and_white_old: getUri(require('./assets/black_and_white_old.png')),
} as const;

export type Filter = keyof typeof FILTERS;

export const isFilter = (filter?: string | null): filter is Filter =>
  !!(FILTERS as any)[filter as Filter];

export const useFilterLabels = (): Record<Filter, string> => {
  const intl = useIntl();
  return useMemo(
    () => ({
      nah: intl.formatMessage({
        defaultMessage: 'Nah',
        description: 'Nah filter name',
      }),
      once: intl.formatMessage({
        defaultMessage: 'Once',
        description: 'Once filter name',
      }),
      passing_by: intl.formatMessage({
        defaultMessage: 'Passing by',
        description: 'Passing by filter name',
      }),
      serenity: intl.formatMessage({
        defaultMessage: 'Serenity',
        description: 'Serenity filter name',
      }),
      solar: intl.formatMessage({
        defaultMessage: 'Solar',
        description: 'Solar filter name',
      }),
      undeniable: intl.formatMessage({
        defaultMessage: 'Undeniable',
        description: 'Undeniable filter name',
      }),
      undeniable2: intl.formatMessage({
        defaultMessage: 'Undeniable 2',
        description: 'Undeniable 2 filter name',
      }),
      you_can_do_it: intl.formatMessage({
        defaultMessage: 'You can do it',
        description: 'You can do it filter name',
      }),
      pure: intl.formatMessage({
        defaultMessage: 'Pure',
        description: 'Pure filter name',
      }),
      syrah: intl.formatMessage({
        defaultMessage: 'Syrah',
        description: 'Syrah filter name',
      }),
      paper: intl.formatMessage({
        defaultMessage: 'Paper',
        description: 'Paper filter name',
      }),
      rock: intl.formatMessage({
        defaultMessage: 'Rock',
        description: 'Rock filter name',
      }),
      vouzon: intl.formatMessage({
        defaultMessage: 'Vouzon',
        description: 'Vouzon filter name',
      }),
      // BIG UP @mlecoq
      transparency: intl.formatMessage({
        defaultMessage: 'Transparency',
        description: 'Transparency filter name',
      }),
      autumn: intl.formatMessage({
        defaultMessage: 'Autumn',
        description: 'Autaumn filter name',
      }),
      one_of_us: intl.formatMessage({
        defaultMessage: 'One of us',
        description: 'One of us filter name',
      }),
      bourbon: intl.formatMessage({
        defaultMessage: 'Bourbon',
        description: 'Bourbon filter name',
      }),
      black_and_white_light: intl.formatMessage({
        defaultMessage: 'B&W light',
        description: 'B&W light filter name',
      }),
      black_and_white_neutral: intl.formatMessage({
        defaultMessage: 'B&W neutral',
        description: 'B&W neutral filter name',
      }),
      black_and_white_old: intl.formatMessage({
        defaultMessage: 'B&W old',
        description: 'B&W old filter name',
      }),
    }),
    [intl],
  );
};
