import type { ImageEditionParameters } from '../../types';
import type {
  HostComponent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

export type MediaImageRendererProps = {
  uri?: string;
  isVideo?: boolean;
  alt: string;
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
  alt: string;
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

export type EditableVideoProps = Omit<ViewProps, 'children'> & {
  uri?: string | null;
  startTime?: number;
  duration?: number;
  editionParameters?: ImageEditionParameters;
  filters?: string[] | null;
  onLoad?: () => void;
};

export type EditableImageSource = {
  uri?: string | null;
  maskUri?: string | null;
  backgroundUri?: string | null;
  foregroundUri?: string | null;
  kind?: 'image' | 'video' | null;
  videoTime?: number;
};

export type EditableImageProps = Omit<ViewProps, 'children'> & {
  source?: EditableImageSource | null;
  editionParameters?: ImageEditionParameters;
  filters?: string[] | null;
  backgroundImageColor?: string | null;
  backgroundImageTintColor?: string | null;
  backgroundMultiply?: boolean | null;
  foregroundImageTintColor?: string | null;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onError?: (event: NativeSyntheticEvent<{ message: string }>) => void;
};
