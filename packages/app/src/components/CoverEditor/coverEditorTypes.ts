import type { EditionParameters, Filter } from '#helpers/mediaEditions';
import type { MediaVideo, MediaImage, TimeRange } from '#helpers/mediaHelpers';
import type { Animation, MEDIA_ANIMATIONS } from './coverDrawer/mediaAnimation';
import type {
  SkImage,
  SkPoint,
  SkRect,
  SkShader,
} from '@shopify/react-native-skia';
import type { ShadowStyleIOS } from 'react-native';

export type CoverEditorState = {
  // Cover data
  layerMode: CoverLayerType;
  selectedLayerIndex: number | null;
  textLayers: CoverEditorTextLayerItem[];
  overlayLayer: CoverEditorOverlayItem | null;
  linksLayer: CoverEditorLinksLayerItem;
  medias: MediaInfo[];
  template: TemplateInfo | null;
  coverTransition: CoverEditorTransition | null;
  backgroundColor: string | null;

  // Resources used for displaying/updating the cover
  images: Record<string, SkImage>;
  videoPaths: Record<string, string>;
  lutShaders: Partial<Record<Filter, SkShader>>;

  // Loading state
  loadingRemoteMedia: boolean;
  loadingLocalMedia: boolean;
};

export type TemplateInfo = {
  __todoTemplateInfo: unknown;
};

export type CoverEditorTransition = 'fade' | 'none' | 'slide';

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
  animation: MEDIA_ANIMATIONS | null;
  duration: number;
};

export type MediaInfo = MediaInfoImage | MediaInfoVideo;

export type CoverLayerType =
  | 'colors'
  | 'links'
  | 'media'
  | 'mediaEdit'
  | 'overlay'
  | 'text'
  | 'textEdit'
  | null;

export type CoverTextLayerStyle = {
  fontFamily: string;
  fontSize: number;
  textAlign: 'center' | 'justify' | 'left' | 'right';
  color?: string;
};

export type CoverEditorTextLayerItem = {
  text: string;
  style: CoverTextLayerStyle;
  position: SkPoint;
  width: number;
  rotation: number;
};

export type CoverEditorOverlayItem = {
  media: MediaImage;
  style: {
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    shadow?: ShadowStyleIOS; //WILL CHANGE WHEN we look a skia shadow
    elevation: number;
  };
  animation: Animation;
  filter?: Filter | null;
  editionParameters?: EditionParameters | null;
  bounds: SkRect;
  rotation: number;
};

export type CoverEditorSocialLink = {
  link: string;
  position: number;
  socialId: string;
};

export type CoverEditorLinksLayerItem = {
  links: CoverEditorSocialLink[];
  style: {
    color: string;
    size: number;
  };
};
