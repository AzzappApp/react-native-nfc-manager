import type { ShadowStyleIOS } from 'react-native';

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
