import type { EditionParameters, Filter } from '#helpers/mediaEditions';
import type { MediaVideo, MediaImage, TimeRange } from '#helpers/mediaHelpers';
import type { ShadowStyleIOS } from 'react-native';

export type CoverEditorState = {
  selectedLayer: CoverEditorSelectedLayer;
  textLayers: CoverEditorTextLayerItem[];
  overlayLayer: CoverEditorOverlayItem | null;
  layerMode: CoverLayerType; //add it here instead of animated value in context  because It could been use for reducer action in some case. TO IMPROVE
  linksLayer: CoverEditorLinksLayerItem;
  medias: MediaInfo[];
  template: TemplateInfo | null;
  coverTransition: CoverEditorTransition | null;
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
};

//TODO define when skia animation are chosen
export type CoverEditorAnimationItem = {
  id: string; // to defined with skia;
  start: number;
  end: number;
};

//TODO IMPROVE Type
export type CoverEditorFilterItem = string | null;

export type CoverEditorOverlayItem = {
  uri: string;
  width: number;
  height: number;
  style: {
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    shadow?: ShadowStyleIOS; //WILL CHANGE WHEN we look a skia shadow
    elevation: number;
  };
  animation?: Partial<CoverEditorAnimationItem> | null;
  filter: CoverEditorFilterItem;
};

export type CoverEditorSelectedLayer =
  | {
      type: 'links';
    }
  | {
      type: 'media';
      index: number;
    }
  | {
      type: 'overlay';
    }
  | {
      type: 'text';
      index: number;
    }
  | null;

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
