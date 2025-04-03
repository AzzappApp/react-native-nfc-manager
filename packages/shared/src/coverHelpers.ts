/**
 * Contains a list of constant and helpers used for user card management
 */

/**
 * The ratio of the card cover
 */
export const COVER_RATIO = 0.625;

/**
 * The max width of user card media (image or video) in pixels
 */
export const COVER_MAX_HEIGHT = 2048;

/**
 * The max height of user card media (image or video) in pixels
 */
export const COVER_MAX_WIDTH = COVER_MAX_HEIGHT * COVER_RATIO;

/**
 * The duration of the cover animation in milliseconds
 */
export const COVER_ANIMATION_DURATION = 5000;

/**
 * The border radius that should be used when a cover is not displayed full screen
 */
export const COVER_CARD_RADIUS = 0.128;

/**
 * The based width of user card
 */
export const COVER_BASE_WIDTH = 125;

/**
 * The minimum font size for the cover title/subtitle
 */
export const COVER_MIN_FONT_SIZE = 6;

/**
 * The maximum font size for the cover title/subtitle
 */
export const COVER_MAX_FONT_SIZE = 128;

/**
 * the list of possible cover asset pre generated sizes
 */
export const COVER_ASSET_SIZES = [128, 256, 512, 1024];

/**
 * Maximum number of media that can compose a cover
 */
export const COVER_MAX_MEDIA = 5;

/**
 *  Maximum duration that a media can be displayed in a cover
 */
export const COVER_IMAGE_DEFAULT_DURATION = 2;

/**
 *  Maximum duration that a media can be displayed in a cover
 */
export const COVER_VIDEO_DEFAULT_DURATION = 4;

/**
 *  Maximum duration that a media can be displayed in a cover
 */
export const COVER_MAX_MEDIA_DURATION = 5;

/**
 *  Minimum duration that a media can be displayed in a cover
 */
export const COVER_MIN_MEDIA_DURATION = 1;

/**
 *  Optimum cover Width
 */
export const DEFAULT_COVER_WIDTH = 375;

/**
 *  Optimum cover Height
 */
export const DEFAULT_COVER_HEIGHT = DEFAULT_COVER_WIDTH / COVER_RATIO;

/**
 * A color that can be replaced in a lottie animation
 */
export const LOTTIE_REPLACE_COLORS = {
  dark: '#010101',
  primary: '#999999',
  light: '#FEFEFE',
};

export const LINKS_GAP = 15;
export const LINKS_BORDER_WIDTH = 2;
export const LINKS_ELEMENT_WRAPPER_MULTIPLER = 1.5;
export const COVER_LINK_SIZE_TO_BORDER_RATIO = 12;

export const convertToBaseCanvasRatio = (
  value: number,
  canvasWidth: number,
) => {
  'worklet';
  return value * (canvasWidth / 300);
};

export const calculateLinksSize = (
  count: number,
  size: number,
  {
    viewWidth,
    viewHeight,
  }: {
    viewWidth: number;
    viewHeight: number;
  },
) => {
  'worklet';
  const gap =
    (convertToBaseCanvasRatio(Math.max(LINKS_GAP * (count - 1), 0), viewWidth) /
      viewWidth) *
    100;

  const elWidth =
    ((convertToBaseCanvasRatio(size, viewWidth) *
      LINKS_ELEMENT_WRAPPER_MULTIPLER) /
      viewWidth) *
    100;

  const width = elWidth * count + gap;

  const height =
    count > 0
      ? (convertToBaseCanvasRatio(size, viewHeight) / viewHeight) * 100
      : 0;

  return { width, height };
};
