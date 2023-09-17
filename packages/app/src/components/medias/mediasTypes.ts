import type {
  HostComponent,
  NativeSyntheticEvent,
  ViewProps,
} from 'react-native';

export type MediaImageRendererProps = ViewProps & {
  /**
   * if true, the MediaImageRenderer will display the first frame of the video
   */
  isVideo?: boolean;
  /**
   * The media alt text
   */
  alt?: string;
  /**
   * The source containing the uri of the media, the cacheId and the requestedSize
   */
  source: { uri: string; mediaId: string; requestedSize: number };
  /**
   * The media aspect ratio
   */
  aspectRatio: number;
  /**
   * The media tintColor
   */
  tintColor?: string | null;
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
   * A callback called when an error was throw while loading the media
   */
  onError?: (error: Error) => void;
};

export type MediaVideoRendererProps = ViewProps & {
  /**
   * The video alt text
   */
  alt?: string;
  /**
   * the thumbnail URI of the video to display while the video is loading
   */
  thumbnailURI?: string;
  /**
   * The source containing the uri of the media, the cacheId and the requestedSize
   */
  source: { uri: string; mediaId: string; requestedSize: number };
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
