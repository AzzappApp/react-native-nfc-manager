import type {
  HostComponent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';

export type MediaImageRendererProps = {
  uri?: string;
  source: string;
  width: number | `${number}vw`;
  aspectRatio: number;
  onLoad?: () => void;
  onReadyForDisplay?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export type MediaVideoRendererProps = {
  uri?: string;
  thumbnailURI?: string;
  source: string;
  width: number | `${number}vw`;
  aspectRatio: number;
  paused?: boolean;
  muted?: boolean;
  currentTime?: number | null;
  onReadyForDisplay?: () => void;
  onEnd?: () => void;
  onProgress?: (event: NativeSyntheticEvent<{ currentTime: number }>) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export type MediaVideoRendererHandle = {
  getContainer(): HostComponent<any> | null;
  getPlayerCurrentTime(): Promise<number | null>;
  snapshot(): Promise<void>;
};
