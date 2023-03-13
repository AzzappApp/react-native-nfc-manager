import type { ImageEditionParameters } from '#helpers/mediaHelpers';
import type {
  HostComponent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

export type MediaImageRendererProps = {
  /**
   * The media URI to display
   */
  uri?: string;
  /**
   * if true, the MediaImageRenderer will display the first frame of the video
   */
  isVideo?: boolean;
  /**
   * The media alt text
   */
  alt: string;
  /**
   * The source id of the media, used for caching
   */
  source: string;
  /**
   * The media width, should be a number on native, the web version supports vw unit
   */
  width: number | `${number}vw`;
  /**
   * The media aspect ratio
   */
  aspectRatio: number;
  /**
   * A callback called when the media is loaded
   */
  onLoad?: () => void;
  /**
   * A callback called when the media is ready to be displayed
   * (the displayed image might be an other version of the original image in a different size)
   */
  onReadyForDisplay?: () => void;

  /**
   * @see ViewProps#style
   */
  style?: StyleProp<ViewStyle>;
  /**
   * @see ViewProps#testID
   */
  testID?: string;
};

export type MediaVideoRendererProps = {
  /**
   * The URI of the video to display
   */
  uri?: string;
  /**
   * The video alt text
   */
  alt: string;
  /**
   * the thumbnail URI of the video to display while the video is loading
   */
  thumbnailURI?: string;
  /**
   * The source id of the video, used for caching
   */
  source: string;
  /**
   * The media width, should be a number on native, the web version supports vw unit
   */
  width: number | `${number}vw`;
  /**
   * The media aspect ratio
   */
  aspectRatio: number;
  /**
   * if true, the video will be paused
   */
  paused?: boolean;
  /**
   * if true, the video will be muted
   */
  muted?: boolean;
  /**
   * if set, the video will be played at the given time, (however it will loop)
   */
  currentTime?: number | null;
  /**
   * A callback called when either the video is ready to be played or
   * that the thumbnail is ready to be displayed
   */
  onReadyForDisplay?: () => void;
  /**
   * A callback called when the video has reached the end (before looping)
   */
  onEnd?: () => void;
  /**
   * A callback called while the video is playing, allowing to track the current time
   */
  onProgress?: (event: NativeSyntheticEvent<{ currentTime: number }>) => void;
  /**
   * @see ViewProps#style
   */
  style?: StyleProp<ViewStyle>;
  /**
   * @see ViewProps#testID
   */
  testID?: string;
};

/**
 * The type of the MediaVideoRenderer ref
 */
export type MediaVideoRendererHandle = {
  /**
   * Returns the container of the video
   */
  getContainer(): HostComponent<any> | null;
  /**
   * Returns the current time of the video
   */
  getPlayerCurrentTime(): Promise<number | null>;
  /**
   * Snapshots the current video frame, allowing the next time a MediaVideoRenderer is mounted
   * to display the snapshot while the video is loading
   */
  snapshot(): Promise<void>;
};

export type EditableVideoProps = Omit<ViewProps, 'children'> & {
  /**
   * The URI of the video to display
   */
  uri?: string | null;
  /**
   * The time at which the video should start playing
   * using `duration` and this prop will allows
   * to play a sliced video time range
   */
  startTime?: number;
  /**
   * The duration of the video to play
   * using `startTime` and this prop will allows
   * to play a sliced video time range
   */
  duration?: number;
  /**
   * Editions parameters to apply to the video
   */
  editionParameters?: ImageEditionParameters;
  /**
   * filters to apply to the video
   */
  filters?: string[] | null;
  /**
   * A callback called when the video is ready to be played
   */
  onLoad?: () => void;
};

/**
 * Represents and editable image source, it can contains multiple layers
 */
export type EditableImageSource = {
  /**
   * The URI of the image
   */
  uri?: string | null;
  /**
   * The URI of the mask image to apply to the image
   */
  maskUri?: string | null;
  /**
   * The URI of an image to display behind the image
   */
  backgroundUri?: string | null;
  /**
   * The URI of an image to display in front of the image
   */
  foregroundUri?: string | null;
  /**
   * kind of the image, can be either 'image' or 'video'
   * @default 'image'
   */
  kind?: 'image' | 'video' | null;
  /**
   * The time of the video frame to display
   */
  videoTime?: number;
};

export type EditableImageProps = Omit<ViewProps, 'children'> & {
  /**
   * The source of the image
   */
  source?: EditableImageSource | null;
  /**
   * Editions parameters to apply to the image
   */
  editionParameters?: ImageEditionParameters;
  /**
   * filters to apply to the image
   */
  filters?: string[] | null;
  /**
   * Color of the background
   */
  backgroundImageColor?: string | null;
  /**
   * A tint color to apply to the background image
   */
  backgroundImageTintColor?: string | null;
  /**
   * if true, the image will be blended with the background image
   */
  backgroundMultiply?: boolean | null;
  /**
   * A tint color to apply to the foreground image
   */
  foregroundImageTintColor?: string | null;
  /**
   * A callback called when the source images  starts loading
   */
  onLoadStart?: () => void;
  /**
   * A callback called when the source images are loaded
   */
  onLoad?: () => void;
  /**
   * A callback called when the source images fail to load
   * @param event and event containing the error message
   */
  onError?: (event: NativeSyntheticEvent<{ message: string }>) => void;
};
