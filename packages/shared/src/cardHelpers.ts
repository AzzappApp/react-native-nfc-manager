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
export const COVER_MAX_WIDTH = 2048 * COVER_RATIO;

/**
 * The max width
 */
export const COVER_MAX_HEIGHT = 2048 * COVER_RATIO;

/**
 * list of possible covertitle position
 */
export const TITLE_POSITIONS = [
  'topLeft',
  'topCenter',
  'topRight',
  'middleLeft',
  'middleCenter',
  'middleRight',
  'bottomLeft',
  'bottomCenter',
  'bottomRight',
];

export const DEFAULT_COVER_FONT_FAMILY = 'Arial';

export const DEFAULT_COVER_FONT_SIZE = 14;

export const DEFAULT_COVER_TEXT_COLOR = '#000000';

export const DEFAULT_COVER_CONTENT_ORTIENTATION = 'horizontal';

export const DEFAULT_COVER_CONTENT_PLACEMENT = 'bottomLeft';

export const DEFAULT_PALETTE_COLOR = [
  '#FFFFFF',
  '#000000',
  '#68C4C9',
  '#EBCC60',
  '#F3A1B0',
  '#B0C0F8',
  '#C8F491',
];

export const DEFAULT_COVER_MIN_FONT_SIZE = 10;

export const DEFAULT_COVER_MAX_FONT_SIZE = 24;
