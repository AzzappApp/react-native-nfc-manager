import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import EditableImage, {
  AnimatedEditableImage,
  EditableImageWithCropMode,
} from './EditableImage';
import EditableVideo, {
  AnimatedEditableVideo,
  EditableVideoWithCropMode,
} from './EditableVideo';
import MediaImageRenderer from './MediaImageRenderer';
import MediaVideoRenderer from './MediaVideoRenderer';
import type { ImageEditionParameters } from '#types';
import type { Icons } from '#ui/Icon';
import type {
  EditableImageProps,
  EditableImageSource,
  EditableVideoProps,
  MediaVideoRendererHandle,
  MediaVideoRendererProps,
  MediaImageRendererProps,
} from './mediasTypes';

export {
  AnimatedEditableImage,
  AnimatedEditableVideo,
  EditableImage,
  EditableVideo,
  MediaImageRenderer,
  MediaVideoRenderer,
  EditableImageWithCropMode,
  EditableVideoWithCropMode,
};

export type {
  EditableImageProps,
  EditableVideoProps,
  EditableImageSource,
  MediaVideoRendererHandle,
  MediaVideoRendererProps,
  MediaImageRendererProps,
};

type ParametersInfo<T> = Partial<Record<keyof ImageEditionParameters, T>>;

export const useEditionParametersDisplayInfos = (): ParametersInfo<{
  label: string;
  icon: Icons;
}> => {
  const intl = useIntl();
  return useMemo(
    () => ({
      cropData: {
        icon: 'contrast',
        label: intl.formatMessage({
          defaultMessage: 'Adjust',
          description: 'Adjust image edition parameters name',
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
        icon: 'contrast',
        label: intl.formatMessage({
          defaultMessage: 'Shadow',
          description: 'Shadow image edition parameters name',
        }),
      },
      sharpness: {
        icon: 'contrast',
        label: intl.formatMessage({
          defaultMessage: 'Sharpness',
          description: 'Sharpness image edition parameters name',
        }),
      },
      structure: {
        icon: 'contrast',
        label: intl.formatMessage({
          defaultMessage: 'Structure',
          description: 'Structure image edition parameters name',
        }),
      },
      temperature: {
        icon: 'temperature',
        label: intl.formatMessage({
          defaultMessage: 'Temperature',
          description: 'Temperature image edition parameters name',
        }),
      },
      tint: {
        icon: 'brightness',
        label: intl.formatMessage({
          defaultMessage: 'Tint',
          description: 'Tint image edition parameters name',
        }),
      },
      vibrance: {
        icon: 'vigneting',
        label: intl.formatMessage({
          defaultMessage: 'Vibrance',
          description: 'Vibrance image edition parameters name',
        }),
      },
      vigneting: {
        icon: 'vigneting',
        label: intl.formatMessage({
          defaultMessage: 'Vigneting',
          description: 'Vigneting image edition parameters name',
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
  interval: number;
  displayOriginalValue?: boolean;
}> = {
  brightness: {
    defaultValue: 0,
    min: -0.5,
    max: 0.5,
    step: 0.025,
    interval: 10,
  },
  contrast: { defaultValue: 1, min: 0.5, max: 1.5, step: 0.025, interval: 10 },
  highlights: { defaultValue: 1, min: 0, max: 1, step: 0.05, interval: 10 },
  saturation: { defaultValue: 1, min: 0, max: 2, step: 0.05, interval: 10 },
  shadow: { defaultValue: 0, min: 0, max: 1, step: 0.05, interval: 10 },
  sharpness: { defaultValue: 0, min: -2, max: 2, step: 0.05, interval: 10 },
  structure: { defaultValue: 0, min: -2, max: 2, step: 0.05, interval: 10 },
  temperature: {
    defaultValue: 6500,
    min: 3500,
    max: 12500,
    step: 50,
    interval: 10,
    displayOriginalValue: true,
  },
  tint: { defaultValue: 0, min: -150, max: 150, step: 5, interval: 10 },
  vibrance: { defaultValue: 0, min: -1, max: 1, step: 0.05, interval: 10 },
  vigneting: { defaultValue: 0, min: -2, max: 2, step: 0.05, interval: 10 },
  roll: {
    defaultValue: 0,
    min: -20,
    max: 20,
    step: 1,
    interval: 10,
    displayOriginalValue: true,
  },
};

export const useFilterList = (): Array<{
  filter: string;
  label: string;
  ios?: boolean;
  android?: boolean;
}> => {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        filter: 'chrome',
        label: intl.formatMessage({
          defaultMessage: 'Chrome',
          description: 'Chrome photo filter name',
        }),
        ios: true,
      },
      {
        filter: 'fade',
        label: intl.formatMessage({
          defaultMessage: 'Fade',
          description: 'Fade photo filter name',
        }),
        ios: true,
      },
      {
        filter: 'instant',
        label: intl.formatMessage({
          defaultMessage: 'Instant',
          description: 'Instant photo filter name',
        }),
        ios: true,
      },
      {
        filter: 'noir',
        label: intl.formatMessage({
          defaultMessage: 'Noir',
          description: 'Noir photo filter name',
        }),
        ios: true,
        android: true,
      },
      {
        filter: 'process',
        label: intl.formatMessage({
          defaultMessage: 'Process',
          description: 'Process photo filter name',
        }),
        ios: true,
        android: true,
      },
      {
        filter: 'tonal',
        label: intl.formatMessage({
          defaultMessage: 'Tonal',
          description: 'Tonal photo filter name',
        }),
        ios: true,
      },
      {
        filter: 'transfer',
        label: intl.formatMessage({
          defaultMessage: 'Transfer',
          description: 'Transfer photo filter name',
        }),
        ios: true,
      },
      {
        filter: 'sepia',
        label: intl.formatMessage({
          defaultMessage: 'Sepia',
          description: 'Sepia photo filter name',
        }),
        ios: true,
        android: true,
      },
      {
        filter: 'thermal',
        label: intl.formatMessage({
          defaultMessage: 'Thermal',
          description: 'Thermal photo filter name',
        }),
        ios: true,
      },
      {
        filter: 'xray',
        label: intl.formatMessage({
          defaultMessage: 'X-ray',
          description: 'X-ray photo filter name',
        }),
        ios: true,
      },
      {
        filter: 'documentary',
        label: intl.formatMessage({
          defaultMessage: 'Documentary',
          description: 'Documentary photo filter name',
        }),
        android: true,
      },
      {
        filter: 'negative',
        label: intl.formatMessage({
          defaultMessage: 'Negative',
          description: 'Negative photo filter name',
        }),
        android: true,
      },
      {
        filter: 'posterize',
        label: intl.formatMessage({
          defaultMessage: 'Posterize',
          description: 'Posterize photo filter name',
        }),
        android: true,
      },
    ],
    [intl],
  );
};
