import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Image } from 'react-native';
import useNativeTexture from './useNativeTexture';
import type { Filter } from '@azzapp/shared/filtersHelper';

export const FILTERS: Record<Filter, any> = {
  nah: require('./assets/nah.png'),
  once: require('./assets/once.png'),
  passing_by: require('./assets/passing_by.png'),
  serenity: require('./assets/serenity.png'),
  solar: require('./assets/solar.png'),
  undeniable: require('./assets/undeniable.png'),
  undeniable2: require('./assets/undeniable2.png'),
  you_can_do_it: require('./assets/you_can_do_it.png'),
  pure: require('./assets/pure.png'),
  syrah: require('./assets/syrah.png'),
  paper: require('./assets/paper.png'),
  rock: require('./assets/rock.png'),
  vouzon: require('./assets/vouzon.png'),
  // BIG UP @mlecoq
  transparency: require('./assets/transparency.png'),
  autumn: require('./assets/autumn.png'),
  one_of_us: require('./assets/one_of_us.png'),
  bourbon: require('./assets/bourbon.png'),
  black_and_white_light: require('./assets/black_and_white_light.png'),
  black_and_white_neutral: require('./assets/black_and_white_neutral.png'),
  black_and_white_old: require('./assets/black_and_white_old.png'),
} as const;

// create an array to have filter in the same order as the designer want
export const useOrdonedFilters = (): Array<{
  id: Filter | 'none';
  label: string;
}> => {
  const intl = useIntl();
  return [
    {
      id: 'none',
      label: intl.formatMessage({
        defaultMessage: 'None',
        description: 'None filter name',
      }),
    },
    {
      id: 'nah',
      label: intl.formatMessage({
        defaultMessage: 'Nah',
        description: 'Nah filter name',
      }),
    },
    {
      id: 'once',
      label: intl.formatMessage({
        defaultMessage: 'Once',
        description: 'Once filter name',
      }),
    },
    {
      id: 'passing_by',
      label: intl.formatMessage({
        defaultMessage: 'Passing by',
        description: 'Passing by filter name',
      }),
    },
    {
      id: 'serenity',
      label: intl.formatMessage({
        defaultMessage: 'Serenity',
        description: 'Serenity filter name',
      }),
    },
    {
      id: 'solar',
      label: intl.formatMessage({
        defaultMessage: 'Solar',
        description: 'Solar filter name',
      }),
    },
    {
      id: 'undeniable',
      label: intl.formatMessage({
        defaultMessage: 'Undeniable',
        description: 'Undeniable filter name',
      }),
    },
    {
      id: 'undeniable2',
      label: intl.formatMessage({
        defaultMessage: 'Undeniable 2',
        description: 'Undeniable 2 filter name',
      }),
    },
    {
      id: 'you_can_do_it',
      label: intl.formatMessage({
        defaultMessage: 'You can do it',
        description: 'You can do it filter name',
      }),
    },
    {
      id: 'pure',
      label: intl.formatMessage({
        defaultMessage: 'Pure',
        description: 'Pure filter name',
      }),
    },
    {
      id: 'syrah',
      label: intl.formatMessage({
        defaultMessage: 'Syrah',
        description: 'Syrah filter name',
      }),
    },
    {
      id: 'paper',
      label: intl.formatMessage({
        defaultMessage: 'Paper',
        description: 'Paper filter name',
      }),
    },
    {
      id: 'rock',
      label: intl.formatMessage({
        defaultMessage: 'Rock',
        description: 'Rock filter name',
      }),
    },
    {
      id: 'vouzon',
      label: intl.formatMessage({
        defaultMessage: 'Vouzon',
        description: 'Vouzon filter name',
      }),
    },
    // BIG UP @mlecoq
    {
      id: 'transparency',
      label: intl.formatMessage({
        defaultMessage: 'Transparency',
        description: 'Transparency filter name',
      }),
    },
    {
      id: 'autumn',
      label: intl.formatMessage({
        defaultMessage: 'Autumn',
        description: 'Autaumn filter name',
      }),
    },
    {
      id: 'one_of_us',
      label: intl.formatMessage({
        defaultMessage: 'One of us',
        description: 'One of us filter name',
      }),
    },
    {
      id: 'bourbon',
      label: intl.formatMessage({
        defaultMessage: 'Bourbon',
        description: 'Bourbon filter name',
      }),
    },
    {
      id: 'black_and_white_light',
      label: intl.formatMessage({
        defaultMessage: 'B&W light',
        description: 'B&W light filter name',
      }),
    },
    {
      id: 'black_and_white_neutral',
      label: intl.formatMessage({
        defaultMessage: 'B&W neutral',
        description: 'B&W neutral filter name',
      }),
    },
    {
      id: 'black_and_white_old',
      label: intl.formatMessage({
        defaultMessage: 'B&W old',
        description: 'B&W old filter name',
      }),
    },
  ] as const;
};

//TODO: depreacted this one and une an array for ordonned filter
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

export const getLutURI = (filter: Filter) => {
  if (process.env.JEST_WORKER_ID) {
    return null;
  }
  const filterImage = Image.resolveAssetSource(FILTERS[filter])?.uri;
  if (!filterImage) {
    console.warn(`Unknown filter ${filter}`);
    return null;
  }
  return filterImage;
};

export const useLutTexture = (
  filter: Filter | null | undefined,
  onError?: (err?: Error) => void,
) => {
  return useNativeTexture({
    uri: filter ? getLutURI(filter) : null,
    kind: 'image',
    onError,
  });
};
