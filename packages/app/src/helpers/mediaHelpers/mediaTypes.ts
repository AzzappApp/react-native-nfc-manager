type MediaBase = {
  /**
   * The URI of the media in the device photo library.
   * might be a ph-asset:// uri on iOS
   */
  galleryUri?: string;
  /**
   * The URI of the media.
   */
  uri: string;
  /**
   * The URI of the media.
   */
  thumbnail?: string | null;
  /**
   * The width of the media.
   */
  width: number;
  /**
   * The height of the media.
   */
  height: number;
};

/**
 * a local image
 */
export type MediaImage = MediaBase & { kind: 'image' };

/**
 * a local video
 */
export type MediaVideo = MediaBase & {
  kind: 'video';
  duration: number;
  rotation: number;
};

/**
 * a local media
 */
export type Media = MediaImage | MediaVideo;

/**
 * A time range
 */
export type TimeRange = {
  /**
   * The start time of the time range in seconds
   */
  startTime: number;
  /**
   * The duration of the time range in seconds
   */
  duration: number;
};
