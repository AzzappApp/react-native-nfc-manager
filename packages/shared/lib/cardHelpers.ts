/**
 * Contains a list of constant and helpers used for user card management
 */

/**
 * The ratio of the card cover
 */
export const COVER_RATIO = 0.625;

/**
 * The border radius that should be used when a cover is not displayed full screen
 */
export const COVER_CARD_RADIUS = 0.128;

/**
 * The based width of user card
 */
export const COVER_BASE_WIDTH = 125;

/**
 * Card cover default styles
 */
export const DEFAULT_CARD_COVER = {
  backgroundColor: '#FFF',
  pictureTransitionTimer: 2,
  overlayEffect: 'none',
  titlePosition: 'bottomLeft',
  titleFont: 'Arial',
  titleFontSize: 16,
  titleColor: '#000',
  titleRotation: 0,
  desktopLayout: 'card',
  dektopImagePosition: 'center',
  qrCodePosition: 'top',
};

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
