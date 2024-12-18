type SourceMediaBase = {
  /**
   * The id of the media.
   */
  id: string;
  /**
   * The URI of the media.
   */
  uri: string;
  /**
   * A thumbnail of the media.
   */
  thumbnail?: string | null;
  /**
   * The original URI of the media in the phone gallery. (if it was imported from the gallery)
   */
  galleryUri?: string | null;
  /**
   * The width of the media.
   */
  width: number;
  /**
   * The height of the media.
   */
  height: number;

  /**
   * can be edited or fixed media.
   */
  editable: boolean;
};

/**
 * a local image
 */
export type SourceMediaImage = SourceMediaBase & { kind: 'image' };

/**
 * a local video
 */
export type SourceMediaVideo = SourceMediaBase & {
  kind: 'video';
  duration: number;
  rotation: number;
};

/**
 * a local media
 */
export type SourceMedia = SourceMediaImage | SourceMediaVideo;

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
