import type { EditionParameters, Filter } from '#helpers/mediaEditions';
import type { MediaVideo, MediaImage, TimeRange } from '#helpers/mediaHelpers';
import type { CoverTransitions } from './coverDrawer/coverTransitions';
import type { MediaAnimations } from './coverDrawer/mediaAnimation';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type {
  SkImage,
  SkPoint,
  SkRect,
  SkShader,
} from '@shopify/react-native-skia';

export type CoverEditorState = {
  // Cover data
  template: TemplateInfo | null;
  backgroundColor: string | null;

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
  images: Record<string, SkImage>;
  videoPaths: Record<string, string>;
  lutShaders: Partial<Record<Filter, SkShader>>;

  // Loading state
  loadingRemoteMedia: boolean;
  loadingLocalMedia: boolean;
  loadingError: any;
};

export type CardColors = Readonly<
  ColorPalette & {
    otherColors: string[];
  }
>;

export type TemplateInfo = {
  __todoTemplateInfo: unknown;
};

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
};

export type CoverEditorOverlayItem = {
  media: MediaImage;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  elevation: number;
  animation: MediaAnimations | null;
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
