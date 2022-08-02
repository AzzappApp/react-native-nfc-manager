import type { Ref } from 'react';
import type { HostComponent, ImageStyle, StyleProp } from 'react-native';
import type { OnProgressData } from 'react-native-video';

export type MediaRendererOptions = {
  paused?: boolean;
  muted?: boolean;
  repeat?: boolean;
  playWhenInactive?: boolean;
  allowsExternalPlayback?: boolean;
  currentTime?: number;
  onReadyForDisplay?: () => void;
  onLoad?: () => void;
  onEnd?: () => void;
  onProgress?: (data: OnProgressData) => void;
};

export type MediaInnerRendererProps = MediaRendererOptions & {
  mediaRef?: Ref<HostComponent<any>>;
  uri?: string;
  source: string;
  width: number | `${number}vw`;
  aspectRatio: number;
  style?: StyleProp<ImageStyle>;
  nativeID?: string;
  testID?: string;
};
