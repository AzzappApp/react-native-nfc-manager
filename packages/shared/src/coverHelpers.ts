/**
 * Contains a list of constant and helpers used for user card management
 */

/**
 * The ratio of the card cover
 */
export const COVER_RATIO = 0.625;

/**
 * Cover video maxium duration in seconds
 */
export const COVER_MAX_VIDEO_DURATTION = 12;

/**
 * Cover video maxium duration in seconds
 */
export const COVER_VIDEO_BITRATE = 5000000;

/**
 * The border radius that should be used when a cover is not displayed full screen
 */
export const COVER_CARD_RADIUS = 0.128;

/**
 * The based width of user card
 */
export const COVER_BASE_WIDTH = 125;

/**
 * The max width
 */
export const COVER_MAX_HEIGHT = 2048;

/**
 * The max width
 */
export const COVER_MAX_WIDTH = COVER_MAX_HEIGHT * COVER_RATIO;

/**
 * The max size of the cover image source file
 */
export const COVER_SOURCE_MAX_IMAGE_DIMENSION = 4096;

/**
 * The max size of the cover video source file
 */
export const COVER_SOURCE_MAX_VIDEO_DIMENSION = 1920;

/**
 * list of possible covertitle position
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

export const DEFAULT_COVER_FONT_FAMILY = 'Arial';

export const DEFAULT_COVER_FONT_SIZE = 14;

export const DEFAULT_COVER_TEXT_COLOR = '#000000';

export const DEFAULT_COVER_CONTENT_ORTIENTATION = 'horizontal' as const;

export const DEFAULT_COVER_CONTENT_POSITION = 'bottomLeft' as const;

export const DEFAULT_COVER_TEXT_STYLE: TextStyle = {
  color: DEFAULT_COVER_TEXT_COLOR,
  fontSize: DEFAULT_COVER_FONT_SIZE,
  fontFamily: DEFAULT_COVER_FONT_FAMILY,
};

export const DEFAULT_COVER_MIN_FONT_SIZE = 10;

export const DEFAULT_COVER_MAX_FONT_SIZE = 24;

export const TITLE_MAX_FONT_SIZE = 72;

export type TextPosition = (typeof TEXT_POSITIONS)[number];

export type TextStyle = {
  color: string;
  fontSize: number;
  fontFamily: string;
};

export type TextOrientation = (typeof TEXT_ORIENTATIONS)[number];

export const textOrientationOrDefaut = (
  orientation: string | null | undefined,
): TextOrientation =>
  TEXT_ORIENTATIONS.includes(orientation as any)
    ? (orientation as TextOrientation)
    : 'horizontal';

export const textPositionOrDefaut = (
  position: string | null | undefined,
): TextPosition =>
  TEXT_POSITIONS.includes(position as any)
    ? (position as TextPosition)
    : 'bottomLeft';

export const TITLE_MIN_VERTICAL_SPACING = 0;
