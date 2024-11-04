import type { EditionParameters } from '#helpers/mediaEditions';
import type { MediaVideo, MediaImage, TimeRange } from '#helpers/mediaHelpers';
import type { CoverTextAnimations } from './coverDrawer/coverTextAnimations';
import type { CoverTransitions } from './coverDrawer/coverTransitions';
import type { MediaAnimations } from './coverDrawer/mediaAnimations';
import type { OverlayAnimations } from './coverDrawer/overlayAnimations';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { Filter } from '@azzapp/shared/filtersHelper';
import type { SkPoint, SkRect, SkShader } from '@shopify/react-native-skia';

export type CoverEditorState = {
  // Cover data
  isModified: boolean;
  coverId?: string;
  lottie: JSON | null;
  backgroundColor: string | null;

  providedMedias: CoverEditionProvidedMedia[];
  medias: MediaInfo[];
  coverTransition: CoverTransitions | null;

  overlayLayers: CoverEditorOverlayItem[];
  textLayers: CoverEditorTextLayerItem[];
  linksLayer: CoverEditorLinksLayerItem;

  cardColors: CardColors;

  // Selection state
  editionMode: CoverEditionMode;
  selectedItemIndex: number | null;

  // Resources used for displaying/updating the cover
  images: Record<string, bigint | null>;
  imagesScales: Record<string, number>;
  videoPaths: Record<string, string>;
  lutShaders: Partial<Record<Filter, SkShader>>;

  // Loading state
  loadingRemoteMedia: boolean;
  loadingLocalMedia: boolean;
  loadingError: any;

  // cover preview informations
  coverPreviewPositionPercentage?: number | null;
  shouldComputeCoverPreviewPositionPercentage: boolean;
};

export type CardColors = Readonly<
  ColorPalette & {
    otherColors: string[];
  }
>;

export type MediaInfoBase = {
  filter: Filter | null;
  editionParameters: EditionParameters | null;
};

export type MediaInfoVideo = MediaInfoBase & {
  media: MediaVideo;
  timeRange: TimeRange;
};

export type MediaInfoImage = MediaInfoBase & {
  media: MediaImage;
  animation: MediaAnimations | null;
  duration: number;
};

export type MediaInfo = MediaInfoImage | MediaInfoVideo;

export type CoverEditionMode =
  | 'colors'
  | 'links'
  | 'media'
  | 'mediaEdit'
  | 'none'
  | 'overlay'
  | 'text'
  | 'textEdit';

export type CoverEditionProvidedMedia = {
  media: MediaInfo;
  index: number;
  editable: boolean;
};

export type CoverEditorTextLayerItem = {
  text: string;
  fontFamily: string;
  fontSize: number;
  textAlign: 'center' | 'left' | 'right';
  color: string;
  position: SkPoint;
  width: number;
  rotation: number;
  shadow: boolean;
  animation: CoverTextAnimations | null;
  startPercentageTotal: number;
  endPercentageTotal: number;
};

export type CoverEditorOverlayItem = {
  media: MediaImage;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  elevation: number;
  animation: OverlayAnimations | null;
  startPercentageTotal: number;
  endPercentageTotal: number;
  filter: Filter | null;
  editionParameters: EditionParameters | null;
  bounds: SkRect;
  rotation: number;
  shadow: boolean;
};

export type CoverEditorSocialLink = {
  link: string;
  position: number;
  socialId: string;
};

export type CoverEditorLinksLayerItem = {
  links: CoverEditorSocialLink[];
  color: string;
  size: number;
  position: SkPoint;
  rotation: number;
  shadow: boolean;
};
