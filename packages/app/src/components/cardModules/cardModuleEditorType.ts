import type { EditionParameters } from '#helpers/mediaEditions';
import type {
  SourceMediaImage,
  SourceMediaVideo,
  TimeRange,
} from '#helpers/mediaHelpers';
import type {
  ModuleKindHasVariants,
  Variant,
} from '#helpers/webcardModuleHelpers';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { CardModuleColor } from '@azzapp/shared/cardModuleHelpers';
import type { Filter } from '@azzapp/shared/filtersHelper';
import type { LayoutChangeEvent, Animated as RNAnimated } from 'react-native';

type CardModuleMediaBase = {
  filter: Filter | null;
  editionParameters: EditionParameters | null;
  smallThumbnail?: string;
};

//duplicated kind here brings easy typing in if conditions.
export type CardModuleVideo = { kind: 'video' } & (CardModuleMediaBase &
  SourceMediaVideo & {
    timeRange: TimeRange | null;
  });

export type CardModuleImage = { kind: 'image' } & (CardModuleMediaBase &
  SourceMediaImage);

export type CardModuleSourceMedia = CardModuleImage | CardModuleVideo; //duplciate kind because propagaiton of type is not good

export type CardModuleMedia = {
  media: CardModuleSourceMedia; //editable has nothing to do in the SourceMediaImage
  title?: string;
  text?: string;
  link?: { url: string; label: string };
  // this boolean will tell us we need to update the new media in the database
  // we can't use anymore the existence of id for this, because we can have a new media with the ID local/ pexel etc
  needDbUpdate?: boolean;
};

export const MAX_IMAGE_CARD_MODULE_PREVIEW_SIZE = { width: 1080, height: 1080 };
export const CARD_MEDIA_VIDEO_DEFAULT_DURATION = 10;
export const CARD_MODULE_VIDEO_MAX_SIZE = 1440;
export const CARD_MODULE_IMAGE_MAX_SIZE = 2048;
export const CARD_MODULE_VIDEO_BIT_RATE = 4000000;
export const CARD_MODULE_VIDEO_FRAME_RATE = 30;

export type CardModuleVariantType = {
  /**
   * The color of the card module
   *
   */
  cardModuleColor: CardModuleColor;
  /**
   *the card style
   *
   */
  cardStyle: CardStyle | null | undefined;
  /**
   * Should the preview be rendered in mobile or desktop mode.
   *
   */
  viewMode: 'desktop' | 'mobile';
  /**
   * The dimension of the container
   * */
  dimension: CardModuleDimension;
  /* 
  callback when a item renderer is pressed, return the index of the item in case of list 
  */
  setEditableItemIndex?: (index: number) => void;

  webCardEditing?: boolean;
};

export type CommonModuleRendererProps<T, V extends ModuleKindHasVariants> = {
  /**
   * The module media data
   */
  data: T;
  /**
   *the card style
   *
   */
  cardStyle: CardStyle | null | undefined;
  /**
   *the color palette
   *
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * The cover background color
   */
  coverBackgroundColor?: string | null | undefined;
  /**
   * Should the preview be rendered in mobile or desktop mode.
   *
   */
  viewMode: 'desktop' | 'mobile';
  /**
   * The variant design of the media module
   *
   */
  variant: Variant<V>;
  /**
   * The dimension of the container
   * */
  dimension: CardModuleDimension;
  /**
   * The scrollPosition of the container (used in variant that require scroll, all new module needs
   *
   */
  scrollPosition?: RNAnimated.Value;

  modulePosition?: number;

  onLayout?: (event: LayoutChangeEvent) => void;
  /* 
  callback when a item renderer is pressed, return the index of the item in case of list 
  */
  setEditableItemIndex?: (index: number) => void;

  disableAnimation?: boolean;
  /* 
  when we are editing the webcard with splitteed view
  */
  webCardEditing?: boolean;
  /* 
  when we are editing the module
  */
  moduleEditing?: boolean;
};

export type CardModuleDimension = {
  width: number;
  height: number;
};
