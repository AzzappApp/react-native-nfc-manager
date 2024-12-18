import type { ColorValue } from 'react-native';

export type CardModuleBackgroundImageProps = {
  layout: { width: number; height: number };
  resizeMode: string | null | undefined;
  backgroundUri: string | null | undefined;
  patternColor: ColorValue | string | null | undefined;
  backgroundOpacity: number;
};
