/**
 * Contains a list of constant and helpers used for user card management
 */

/**
 * The ratio of the card cover
 */
export const COVER_RATIO = 0.625;

/**
 * The duration of the cover animation in milliseconds
 */
export const COVER_ANIMATION_DURATION = 5000;

/**
 * Cover video maxium duration in seconds
 */
export const COVER_MAX_VIDEO_DURATION = 12;

/**
 * Cover video bitrate
 */
export const COVER_VIDEO_BITRATE = 5000000;

/**
 * Cover video frame rate
 */
export const COVER_FRAME_RATE = 30;

/**
 * The border radius that should be used when a cover is not displayed full screen
 */
export const COVER_CARD_RADIUS = 0.128;

/**
 * The based width of user card
 */
export const COVER_BASE_WIDTH = 125;

/**
 * The max width of user card media (image or video) in pixels
 */
export const COVER_MAX_HEIGHT = 2048;

/**
 * The max height of user card media (image or video) in pixels
 */
export const COVER_MAX_WIDTH = COVER_MAX_HEIGHT * COVER_RATIO;

/**
 * The max size of the cover image source file in pixels
 * @note this dimension applies to the width and height of the image
 */
export const COVER_SOURCE_MAX_IMAGE_DIMENSION = 4096;

/**
 * The max size of the cover video source file
 * @note this dimension applies to the width and height of the video
 */
export const COVER_SOURCE_MAX_VIDEO_DIMENSION = 2048;

/**
 * The default cover font family
 */
export const DEFAULT_COVER_FONT_FAMILY = 'Poppins_Bold';

/**
 * The default cover font size
 */
export const DEFAULT_COVER_FONT_SIZE = 16;

/**
 * The default cover text color
 */
export const DEFAULT_COVER_TEXT_COLOR = '#FFF';

/**
 * The default cover text color
 */
export const DEFAULT_COVER_CONTENT_ORTIENTATION = 'horizontal' as const;

/**
 * The default cover text color
 */
export const DEFAULT_COVER_CONTENT_POSITION = 'middleCenter' as const;

/**
 * The default cover text style
 */
export const DEFAULT_COVER_TEXT_STYLE: TextStyle = {
  color: DEFAULT_COVER_TEXT_COLOR,
  fontSize: DEFAULT_COVER_FONT_SIZE,
  fontFamily: DEFAULT_COVER_FONT_FAMILY,
};

/**
 * The default cover subtitle text style
 */
export const DEFAULT_COVER_SUBTITLE_TEXT_STYLE: TextStyle = {
  color: 'primary',
  fontSize: 8,
  fontFamily: DEFAULT_COVER_FONT_FAMILY,
};

/**
 * The minimum font size for the cover title/subtitle
 */
export const COVER_MIN_FONT_SIZE = 6;

/**
 * The maximum font size for the cover title/subtitle
 */
export const COVER_MAX_FONT_SIZE = 48;

/**
 * list of possible cover title position
 */
export const TEXT_POSITIONS = [
  'topLeft',
  'topCenter',
  'topRight',
  'middleLeft',
  'middleCenter',
  'middleRight',
  'bottomLeft',
  'bottomCenter',
  'bottomRight',
] as const;

/**
 * list of possible text orientation
 */
export const TEXT_ORIENTATIONS = [
  'horizontal',
  'topToBottom',
  'bottomToTop',
] as const;

/**
 * An helper function that returns the given position if it is valid, otherwise it returns the default one
 */
export const textPositionOrDefault = (
  position: string | null | undefined,
): TextPosition =>
  TEXT_POSITIONS.includes(position as any)
    ? (position as TextPosition)
    : 'bottomLeft';

/**
 * The enum of possible text position
 */
export type TextPosition = (typeof TEXT_POSITIONS)[number];

/**
 * The style type for the cover text
 */
export type TextStyle = {
  color: string;
  fontSize: number;
  fontFamily: string;
};

/**
 * The enum of possible text orientation
 */
export type TextOrientation = (typeof TEXT_ORIENTATIONS)[number];

/**
 * An helper function that returns the given orientation if it is valid, otherwise it returns the default one
 *
 */
export const textOrientationOrDefault = (
  orientation: string | null | undefined,
): TextOrientation =>
  TEXT_ORIENTATIONS.includes(orientation as any)
    ? (orientation as TextOrientation)
    : 'horizontal';
/**
 * the list of possible cover asset pre generated sizes
 */
export const COVER_ASSET_SIZES = [128, 256, 512, 1024];

/**
 * The color to replace in foreground lottie animation
 */
export const COVER_FOREGROUND_BASE_COLOR = '#010101';
