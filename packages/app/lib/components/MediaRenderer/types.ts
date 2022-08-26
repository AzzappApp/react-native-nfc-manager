import type { ImageStyle, NativeSyntheticEvent, StyleProp } from 'react-native';

export type MediaRendererOptions = {
  paused?: boolean;
  muted?: boolean;
  currentTime?: number;
  onReadyForDisplay?: () => void;
  onEnd?: () => void;
  onProgress?: (event: NativeSyntheticEvent<{ currentTime: number }>) => void;
};

export type MediaInnerRendererProps = MediaRendererOptions & {
  uri?: string;
  source: string;
  width: number | `${number}vw`;
  aspectRatio: number;
  style?: StyleProp<ImageStyle>;
  nativeID?: string;
  testID?: string;
};
