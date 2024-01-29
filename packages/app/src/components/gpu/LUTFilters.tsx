/* eslint-disable @typescript-eslint/no-var-requires */
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Image } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

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
