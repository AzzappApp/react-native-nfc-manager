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
  BandW_light: getUri(require('./assets/luts/B&W_light.png')),
  BandW_neutral: getUri(require('./assets/luts/B&W_neutral.png')),
  BandW_old: getUri(require('./assets/luts/B&W_old.png')),
  Blue_Architecture___converted_with_Color: getUri(
    require('./assets/luts/Blue_Architecture_-_converted_with_Color.png'),
  ),
  BlueHour___converted_with_Color: getUri(
    require('./assets/luts/BlueHour_-_converted_with_Color.png'),
  ),
  ColdChrome___converted_with_Color: getUri(
    require('./assets/luts/ColdChrome_-_converted_with_Color.png'),
  ),
  CrispAutumn___converted_with_Color: getUri(
    require('./assets/luts/CrispAutumn_-_converted_with_Color.png'),
  ),
  DarkAndSomber___converted_with_Color: getUri(
    require('./assets/luts/DarkAndSomber_-_converted_with_Color.png'),
  ),
  Going_for_a_walk: getUri(require('./assets/luts/Going_for_a_walk.png')),
  Good_morning: getUri(require('./assets/luts/Good_morning.png')),
  Long_Beach_Morning___converted_with_Color: getUri(
    require('./assets/luts/Long_Beach_Morning_-_converted_with_Color.png'),
  ),
  Lush_Green___converted_with_Color: getUri(
    require('./assets/luts/Lush_Green_-_converted_with_Color.png'),
  ),
  MagicHour___converted_with_Color: getUri(
    require('./assets/luts/MagicHour_-_converted_with_Color.png'),
  ),
  Nah: getUri(require('./assets/luts/Nah.png')),
  NaturalBoost___converted_with_Color: getUri(
    require('./assets/luts/NaturalBoost_-_converted_with_Color.png'),
  ),
  Once_upon_a_time: getUri(require('./assets/luts/Once_upon_a_time.png')),
  OrangeAndBlue___converted_with_Color: getUri(
    require('./assets/luts/OrangeAndBlue_-_converted_with_Color.png'),
  ),
  Passing_by: getUri(require('./assets/luts/Passing_by.png')),
  Serenity: getUri(require('./assets/luts/Serenity.png')),
  Smooth_Sailing: getUri(require('./assets/luts/Smooth_Sailing.png')),
  SoftBlackAndWhite___converted_with_Color: getUri(
    require('./assets/luts/SoftBlackAndWhite_-_converted_with_Color.png'),
  ),
  Solar: getUri(require('./assets/luts/Solar.png')),
  Undeniable: getUri(require('./assets/luts/Undeniable.png')),
  Undeniable2: getUri(require('./assets/luts/Undeniable2.png')),
  Urban_cowboy: getUri(require('./assets/luts/Urban_cowboy.png')),
  Waves___converted_with_Color: getUri(
    require('./assets/luts/Waves_-_converted_with_Color.png'),
  ),
  Well_see: getUri(require('./assets/luts/We_ll_see.png')),
  You_can_do_it: getUri(require('./assets/luts/You_can_do_it.png')),
  arabica: getUri(require('./assets/luts/arabica.png')),
  ava: getUri(require('./assets/luts/ava.png')),
  azrael: getUri(require('./assets/luts/azrael.png')),
  azzapp01: getUri(require('./assets/luts/azzapp01.png')),
  azzapp02: getUri(require('./assets/luts/azzapp02.png')),
  azzapp03: getUri(require('./assets/luts/azzapp03.png')),
  azzapp04: getUri(require('./assets/luts/azzapp04.png')),
  azzapp05: getUri(require('./assets/luts/azzapp05.png')),
  azzapp06: getUri(require('./assets/luts/azzapp06.png')),
  azzapp07: getUri(require('./assets/luts/azzapp07.png')),
  azzapp08: getUri(require('./assets/luts/azzapp08.png')),
  azzapp09: getUri(require('./assets/luts/azzapp09.png')),
  azzapp10: getUri(require('./assets/luts/azzapp10.png')),
  azzapp11: getUri(require('./assets/luts/azzapp11.png')),
  azzapp12: getUri(require('./assets/luts/azzapp12.png')),
  azzapp13: getUri(require('./assets/luts/azzapp13.png')),
  azzapp14: getUri(require('./assets/luts/azzapp14.png')),
  azzapp15: getUri(require('./assets/luts/azzapp15.png')),
  azzapp16: getUri(require('./assets/luts/azzapp16.png')),
  azzapp17: getUri(require('./assets/luts/azzapp17.png')),
  azzapp18: getUri(require('./assets/luts/azzapp18.png')),
  azzapp19: getUri(require('./assets/luts/azzapp19.png')),
  azzapp20: getUri(require('./assets/luts/azzapp20.png')),
  azzapp21: getUri(require('./assets/luts/azzapp21.png')),
  azzapp22: getUri(require('./assets/luts/azzapp22.png')),
  azzapp23: getUri(require('./assets/luts/azzapp23.png')),
  azzapp24: getUri(require('./assets/luts/azzapp24.png')),
  azzapp25: getUri(require('./assets/luts/azzapp25.png')),
  azzapp26: getUri(require('./assets/luts/azzapp26.png')),
  azzapp27: getUri(require('./assets/luts/azzapp27.png')),
  azzapp28: getUri(require('./assets/luts/azzapp28.png')),
  azzapp29: getUri(require('./assets/luts/azzapp29.png')),
  azzapp30: getUri(require('./assets/luts/azzapp30.png')),
  azzapp31: getUri(require('./assets/luts/azzapp31.png')),
  azzapp32: getUri(require('./assets/luts/azzapp32.png')),
  azzapp33: getUri(require('./assets/luts/azzapp33.png')),
  azzapp34: getUri(require('./assets/luts/azzapp34.png')),
  azzapp35: getUri(require('./assets/luts/azzapp35.png')),
  azzapp36: getUri(require('./assets/luts/azzapp36.png')),
  azzapp37: getUri(require('./assets/luts/azzapp37.png')),
  azzapp38: getUri(require('./assets/luts/azzapp38.png')),
  azzapp39: getUri(require('./assets/luts/azzapp39.png')),
  azzapp40: getUri(require('./assets/luts/azzapp40.png')),
  azzapp41: getUri(require('./assets/luts/azzapp41.png')),
  azzapp42: getUri(require('./assets/luts/azzapp42.png')),
  azzapp43: getUri(require('./assets/luts/azzapp43.png')),
  azzapp44: getUri(require('./assets/luts/azzapp44.png')),
  azzapp45: getUri(require('./assets/luts/azzapp45.png')),
  azzapp46: getUri(require('./assets/luts/azzapp46.png')),
  azzapp47: getUri(require('./assets/luts/azzapp47.png')),
  azzapp48: getUri(require('./assets/luts/azzapp48.png')),
  azzapp49: getUri(require('./assets/luts/azzapp49.png')),
  azzapp50: getUri(require('./assets/luts/azzapp50.png')),
  bourbon: getUri(require('./assets/luts/bourbon.png')),
  byers: getUri(require('./assets/luts/byers.png')),
  chemical: getUri(require('./assets/luts/chemical.png')),
  clayton: getUri(require('./assets/luts/clayton.png')),
  clousseau: getUri(require('./assets/luts/clousseau.png')),
  cobi: getUri(require('./assets/luts/cobi.png')),
  contrail: getUri(require('./assets/luts/contrail.png')),
  cubicle: getUri(require('./assets/luts/cubicle.png')),
  django: getUri(require('./assets/luts/django.png')),
  domingo: getUri(require('./assets/luts/domingo.png')),
  faded: getUri(require('./assets/luts/faded.png')),
  folger: getUri(require('./assets/luts/folger.png')),
  fusion: getUri(require('./assets/luts/fusion.png')),
  hyla: getUri(require('./assets/luts/hyla.png')),
  korben: getUri(require('./assets/luts/korben.png')),
  lenox: getUri(require('./assets/luts/lenox.png')),
  lucky: getUri(require('./assets/luts/lucky.png')),
  mckinnon: getUri(require('./assets/luts/mckinnon.png')),
  milo: getUri(require('./assets/luts/milo.png')),
  neon: getUri(require('./assets/luts/neon.png')),
  paladin: getUri(require('./assets/luts/paladin.png')),
  pasadena: getUri(require('./assets/luts/pasadena.png')),
  pitaya: getUri(require('./assets/luts/pitaya.png')),
  reeve: getUri(require('./assets/luts/reeve.png')),
  remy: getUri(require('./assets/luts/remy.png')),
  sprocket: getUri(require('./assets/luts/sprocket.png')),
  teigen: getUri(require('./assets/luts/teigen.png')),
  trent: getUri(require('./assets/luts/trent.png')),
  tweed: getUri(require('./assets/luts/tweed.png')),
  vireo: getUri(require('./assets/luts/vireo.png')),
  woodstock: getUri(require('./assets/luts/woodstock.png')),
  zed: getUri(require('./assets/luts/zed.png')),
  zeke: getUri(require('./assets/luts/zeke.png')),
} as const;

export type Filter = keyof typeof FILTERS;

export const isFilter = (filter?: string | null): filter is Filter =>
  !!(FILTERS as any)[filter as Filter];

export const useFilterLabels = (): Record<Filter, string> => {
  const intl = useIntl();
  return useMemo(
    () => ({
      BandW_light: intl.formatMessage({
        defaultMessage: 'B&W_light',
        description: 'B&W_light photo filter name',
      }),
      BandW_neutral: intl.formatMessage({
        defaultMessage: 'B&W_neutral',
        description: 'B&W_neutral photo filter name',
      }),
      BandW_old: intl.formatMessage({
        defaultMessage: 'B&W_old',
        description: 'B&W_old photo filter name',
      }),
      Blue_Architecture___converted_with_Color: intl.formatMessage({
        defaultMessage: 'Blue Architecture - converted with Color',
        description:
          'Blue Architecture - converted with Color photo filter name',
      }),
      BlueHour___converted_with_Color: intl.formatMessage({
        defaultMessage: 'BlueHour - converted with Color',
        description: 'BlueHour - converted with Color photo filter name',
      }),
      ColdChrome___converted_with_Color: intl.formatMessage({
        defaultMessage: 'ColdChrome - converted with Color',
        description: 'ColdChrome - converted with Color photo filter name',
      }),
      CrispAutumn___converted_with_Color: intl.formatMessage({
        defaultMessage: 'CrispAutumn - converted with Color',
        description: 'CrispAutumn - converted with Color photo filter name',
      }),
      DarkAndSomber___converted_with_Color: intl.formatMessage({
        defaultMessage: 'DarkAndSomber - converted with Color',
        description: 'DarkAndSomber - converted with Color photo filter name',
      }),
      Going_for_a_walk: intl.formatMessage({
        defaultMessage: 'Going for a walk',
        description: 'Going for a walk photo filter name',
      }),
      Good_morning: intl.formatMessage({
        defaultMessage: 'Good morning',
        description: 'Good morning photo filter name',
      }),
      Long_Beach_Morning___converted_with_Color: intl.formatMessage({
        defaultMessage: 'Long Beach Morning - converted with Color',
        description:
          'Long Beach Morning - converted with Color photo filter name',
      }),
      Lush_Green___converted_with_Color: intl.formatMessage({
        defaultMessage: 'Lush Green - converted with Color',
        description: 'Lush Green - converted with Color photo filter name',
      }),
      MagicHour___converted_with_Color: intl.formatMessage({
        defaultMessage: 'MagicHour - converted with Color',
        description: 'MagicHour - converted with Color photo filter name',
      }),
      Nah: intl.formatMessage({
        defaultMessage: 'Nah',
        description: 'Nah photo filter name',
      }),
      NaturalBoost___converted_with_Color: intl.formatMessage({
        defaultMessage: 'NaturalBoost - converted with Color',
        description: 'NaturalBoost - converted with Color photo filter name',
      }),
      Once_upon_a_time: intl.formatMessage({
        defaultMessage: 'Once upon a time',
        description: 'Once upon a time photo filter name',
      }),
      OrangeAndBlue___converted_with_Color: intl.formatMessage({
        defaultMessage: 'OrangeAndBlue - converted with Color',
        description: 'OrangeAndBlue - converted with Color photo filter name',
      }),
      Passing_by: intl.formatMessage({
        defaultMessage: 'Passing by',
        description: 'Passing by photo filter name',
      }),
      Serenity: intl.formatMessage({
        defaultMessage: 'Serenity',
        description: 'Serenity photo filter name',
      }),
      Smooth_Sailing: intl.formatMessage({
        defaultMessage: 'Smooth Sailing',
        description: 'Smooth Sailing photo filter name',
      }),
      SoftBlackAndWhite___converted_with_Color: intl.formatMessage({
        defaultMessage: 'SoftBlackAndWhite - converted with Color',
        description:
          'SoftBlackAndWhite - converted with Color photo filter name',
      }),
      Solar: intl.formatMessage({
        defaultMessage: 'Solar',
        description: 'Solar photo filter name',
      }),
      Undeniable: intl.formatMessage({
        defaultMessage: 'Undeniable',
        description: 'Undeniable photo filter name',
      }),
      Undeniable2: intl.formatMessage({
        defaultMessage: 'Undeniable2',
        description: 'Undeniable2 photo filter name',
      }),
      Urban_cowboy: intl.formatMessage({
        defaultMessage: 'Urban cowboy',
        description: 'Urban cowboy photo filter name',
      }),
      Waves___converted_with_Color: intl.formatMessage({
        defaultMessage: 'Waves - converted with Color',
        description: 'Waves - converted with Color photo filter name',
      }),
      Well_see: intl.formatMessage({
        defaultMessage: "We'll see",
        description: "We'll see photo filter name",
      }),
      You_can_do_it: intl.formatMessage({
        defaultMessage: 'You can do it',
        description: 'You can do it photo filter name',
      }),
      arabica: intl.formatMessage({
        defaultMessage: 'arabica',
        description: 'arabica photo filter name',
      }),
      ava: intl.formatMessage({
        defaultMessage: 'ava',
        description: 'ava photo filter name',
      }),
      azrael: intl.formatMessage({
        defaultMessage: 'azrael',
        description: 'azrael photo filter name',
      }),
      azzapp01: intl.formatMessage({
        defaultMessage: 'azzapp01',
        description: 'azzapp01 photo filter name',
      }),
      azzapp02: intl.formatMessage({
        defaultMessage: 'azzapp02',
        description: 'azzapp02 photo filter name',
      }),
      azzapp03: intl.formatMessage({
        defaultMessage: 'azzapp03',
        description: 'azzapp03 photo filter name',
      }),
      azzapp04: intl.formatMessage({
        defaultMessage: 'azzapp04',
        description: 'azzapp04 photo filter name',
      }),
      azzapp05: intl.formatMessage({
        defaultMessage: 'azzapp05',
        description: 'azzapp05 photo filter name',
      }),
      azzapp06: intl.formatMessage({
        defaultMessage: 'azzapp06',
        description: 'azzapp06 photo filter name',
      }),
      azzapp07: intl.formatMessage({
        defaultMessage: 'azzapp07',
        description: 'azzapp07 photo filter name',
      }),
      azzapp08: intl.formatMessage({
        defaultMessage: 'azzapp08',
        description: 'azzapp08 photo filter name',
      }),
      azzapp09: intl.formatMessage({
        defaultMessage: 'azzapp09',
        description: 'azzapp09 photo filter name',
      }),
      azzapp10: intl.formatMessage({
        defaultMessage: 'azzapp10',
        description: 'azzapp10 photo filter name',
      }),
      azzapp11: intl.formatMessage({
        defaultMessage: 'azzapp11',
        description: 'azzapp11 photo filter name',
      }),
      azzapp12: intl.formatMessage({
        defaultMessage: 'azzapp12',
        description: 'azzapp12 photo filter name',
      }),
      azzapp13: intl.formatMessage({
        defaultMessage: 'azzapp13',
        description: 'azzapp13 photo filter name',
      }),
      azzapp14: intl.formatMessage({
        defaultMessage: 'azzapp14',
        description: 'azzapp14 photo filter name',
      }),
      azzapp15: intl.formatMessage({
        defaultMessage: 'azzapp15',
        description: 'azzapp15 photo filter name',
      }),
      azzapp16: intl.formatMessage({
        defaultMessage: 'azzapp16',
        description: 'azzapp16 photo filter name',
      }),
      azzapp17: intl.formatMessage({
        defaultMessage: 'azzapp17',
        description: 'azzapp17 photo filter name',
      }),
      azzapp18: intl.formatMessage({
        defaultMessage: 'azzapp18',
        description: 'azzapp18 photo filter name',
      }),
      azzapp19: intl.formatMessage({
        defaultMessage: 'azzapp19',
        description: 'azzapp19 photo filter name',
      }),
      azzapp20: intl.formatMessage({
        defaultMessage: 'azzapp20',
        description: 'azzapp20 photo filter name',
      }),
      azzapp21: intl.formatMessage({
        defaultMessage: 'azzapp21',
        description: 'azzapp21 photo filter name',
      }),
      azzapp22: intl.formatMessage({
        defaultMessage: 'azzapp22',
        description: 'azzapp22 photo filter name',
      }),
      azzapp23: intl.formatMessage({
        defaultMessage: 'azzapp23',
        description: 'azzapp23 photo filter name',
      }),
      azzapp24: intl.formatMessage({
        defaultMessage: 'azzapp24',
        description: 'azzapp24 photo filter name',
      }),
      azzapp25: intl.formatMessage({
        defaultMessage: 'azzapp25',
        description: 'azzapp25 photo filter name',
      }),
      azzapp26: intl.formatMessage({
        defaultMessage: 'azzapp26',
        description: 'azzapp26 photo filter name',
      }),
      azzapp27: intl.formatMessage({
        defaultMessage: 'azzapp27',
        description: 'azzapp27 photo filter name',
      }),
      azzapp28: intl.formatMessage({
        defaultMessage: 'azzapp28',
        description: 'azzapp28 photo filter name',
      }),
      azzapp29: intl.formatMessage({
        defaultMessage: 'azzapp29',
        description: 'azzapp29 photo filter name',
      }),
      azzapp30: intl.formatMessage({
        defaultMessage: 'azzapp30',
        description: 'azzapp30 photo filter name',
      }),
      azzapp31: intl.formatMessage({
        defaultMessage: 'azzapp31',
        description: 'azzapp31 photo filter name',
      }),
      azzapp32: intl.formatMessage({
        defaultMessage: 'azzapp32',
        description: 'azzapp32 photo filter name',
      }),
      azzapp33: intl.formatMessage({
        defaultMessage: 'azzapp33',
        description: 'azzapp33 photo filter name',
      }),
      azzapp34: intl.formatMessage({
        defaultMessage: 'azzapp34',
        description: 'azzapp34 photo filter name',
      }),
      azzapp35: intl.formatMessage({
        defaultMessage: 'azzapp35',
        description: 'azzapp35 photo filter name',
      }),
      azzapp36: intl.formatMessage({
        defaultMessage: 'azzapp36',
        description: 'azzapp36 photo filter name',
      }),
      azzapp37: intl.formatMessage({
        defaultMessage: 'azzapp37',
        description: 'azzapp37 photo filter name',
      }),
      azzapp38: intl.formatMessage({
        defaultMessage: 'azzapp38',
        description: 'azzapp38 photo filter name',
      }),
      azzapp39: intl.formatMessage({
        defaultMessage: 'azzapp39',
        description: 'azzapp39 photo filter name',
      }),
      azzapp40: intl.formatMessage({
        defaultMessage: 'azzapp40',
        description: 'azzapp40 photo filter name',
      }),
      azzapp41: intl.formatMessage({
        defaultMessage: 'azzapp41',
        description: 'azzapp41 photo filter name',
      }),
      azzapp42: intl.formatMessage({
        defaultMessage: 'azzapp42',
        description: 'azzapp42 photo filter name',
      }),
      azzapp43: intl.formatMessage({
        defaultMessage: 'azzapp43',
        description: 'azzapp43 photo filter name',
      }),
      azzapp44: intl.formatMessage({
        defaultMessage: 'azzapp44',
        description: 'azzapp44 photo filter name',
      }),
      azzapp45: intl.formatMessage({
        defaultMessage: 'azzapp45',
        description: 'azzapp45 photo filter name',
      }),
      azzapp46: intl.formatMessage({
        defaultMessage: 'azzapp46',
        description: 'azzapp46 photo filter name',
      }),
      azzapp47: intl.formatMessage({
        defaultMessage: 'azzapp47',
        description: 'azzapp47 photo filter name',
      }),
      azzapp48: intl.formatMessage({
        defaultMessage: 'azzapp48',
        description: 'azzapp48 photo filter name',
      }),
      azzapp49: intl.formatMessage({
        defaultMessage: 'azzapp49',
        description: 'azzapp49 photo filter name',
      }),
      azzapp50: intl.formatMessage({
        defaultMessage: 'azzapp50',
        description: 'azzapp50 photo filter name',
      }),
      bourbon: intl.formatMessage({
        defaultMessage: 'bourbon',
        description: 'bourbon photo filter name',
      }),
      byers: intl.formatMessage({
        defaultMessage: 'byers',
        description: 'byers photo filter name',
      }),
      chemical: intl.formatMessage({
        defaultMessage: 'chemical',
        description: 'chemical photo filter name',
      }),
      clayton: intl.formatMessage({
        defaultMessage: 'clayton',
        description: 'clayton photo filter name',
      }),
      clousseau: intl.formatMessage({
        defaultMessage: 'clousseau',
        description: 'clousseau photo filter name',
      }),
      cobi: intl.formatMessage({
        defaultMessage: 'cobi',
        description: 'cobi photo filter name',
      }),
      contrail: intl.formatMessage({
        defaultMessage: 'contrail',
        description: 'contrail photo filter name',
      }),
      cubicle: intl.formatMessage({
        defaultMessage: 'cubicle',
        description: 'cubicle photo filter name',
      }),
      django: intl.formatMessage({
        defaultMessage: 'django',
        description: 'django photo filter name',
      }),
      domingo: intl.formatMessage({
        defaultMessage: 'domingo',
        description: 'domingo photo filter name',
      }),
      faded: intl.formatMessage({
        defaultMessage: 'faded',
        description: 'faded photo filter name',
      }),
      folger: intl.formatMessage({
        defaultMessage: 'folger',
        description: 'folger photo filter name',
      }),
      fusion: intl.formatMessage({
        defaultMessage: 'fusion',
        description: 'fusion photo filter name',
      }),
      hyla: intl.formatMessage({
        defaultMessage: 'hyla',
        description: 'hyla photo filter name',
      }),
      korben: intl.formatMessage({
        defaultMessage: 'korben',
        description: 'korben photo filter name',
      }),
      lenox: intl.formatMessage({
        defaultMessage: 'lenox',
        description: 'lenox photo filter name',
      }),
      lucky: intl.formatMessage({
        defaultMessage: 'lucky',
        description: 'lucky photo filter name',
      }),
      mckinnon: intl.formatMessage({
        defaultMessage: 'mckinnon',
        description: 'mckinnon photo filter name',
      }),
      milo: intl.formatMessage({
        defaultMessage: 'milo',
        description: 'milo photo filter name',
      }),
      neon: intl.formatMessage({
        defaultMessage: 'neon',
        description: 'neon photo filter name',
      }),
      paladin: intl.formatMessage({
        defaultMessage: 'paladin',
        description: 'paladin photo filter name',
      }),
      pasadena: intl.formatMessage({
        defaultMessage: 'pasadena',
        description: 'pasadena photo filter name',
      }),
      pitaya: intl.formatMessage({
        defaultMessage: 'pitaya',
        description: 'pitaya photo filter name',
      }),
      reeve: intl.formatMessage({
        defaultMessage: 'reeve',
        description: 'reeve photo filter name',
      }),
      remy: intl.formatMessage({
        defaultMessage: 'remy',
        description: 'remy photo filter name',
      }),
      sprocket: intl.formatMessage({
        defaultMessage: 'sprocket',
        description: 'sprocket photo filter name',
      }),
      teigen: intl.formatMessage({
        defaultMessage: 'teigen',
        description: 'teigen photo filter name',
      }),
      trent: intl.formatMessage({
        defaultMessage: 'trent',
        description: 'trent photo filter name',
      }),
      tweed: intl.formatMessage({
        defaultMessage: 'tweed',
        description: 'tweed photo filter name',
      }),
      vireo: intl.formatMessage({
        defaultMessage: 'vireo',
        description: 'vireo photo filter name',
      }),
      woodstock: intl.formatMessage({
        defaultMessage: 'woodstock',
        description: 'woodstock photo filter name',
      }),
      zed: intl.formatMessage({
        defaultMessage: 'zed',
        description: 'zed photo filter name',
      }),
      zeke: intl.formatMessage({
        defaultMessage: 'zeke',
        description: 'zeke photo filter name',
      }),
    }),
    [intl],
  );
};
