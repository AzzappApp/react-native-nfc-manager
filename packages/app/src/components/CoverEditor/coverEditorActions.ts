import type { EditionParameters } from '#helpers/mediaEditions';
import type { TextureInfo } from '#helpers/mediaEditions/NativeTextureLoader';
import type {
  SourceMediaImage,
  SourceMedia,
  TimeRange,
} from '#helpers/mediaHelpers';
import type { CoverTransitions } from './coverDrawer/coverTransitions';
import type { MediaAnimations } from './coverDrawer/mediaAnimations';
import type {
  CoverEditorOverlayItem,
  CoverEditorSocialLink,
  CoverEditionMode,
  CoverEditorTextLayerItem,
  CardColors,
  CoverEditorLinksLayerItem,
} from './coverEditorTypes';
import type { Filter } from '@azzapp/shared/filtersHelper';

// #region Generic Layer Actions
export type SetEditionModeAction = {
  type: 'SET_EDITION_MODE';
  payload: {
    selectedItemIndex: number | null;
    editionMode: CoverEditionMode;
  };
};

export type DuplicateCurrentLayerAction = {
  type: 'DUPLICATE_CURRENT_LAYER';
  payload?: undefined;
};

export type DeleteCurrentLayerAction = {
  type: 'DELETE_CURRENT_LAYER';
  payload?: undefined;
};

export type UpdateLayerShadowAction = {
  type: 'UPDATE_LAYER_SHADOW';
  payload: { enabled: boolean };
};

export type UpdateLayerBorderAction = {
  type: 'UPDATE_LAYER_BORDER';
  payload: Partial<{
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
  }>;
};
// #endregion

// #region Colors
export type UpdateCardColorsAction = {
  type: 'UPDATE_CARD_COLORS';
  payload: CardColors;
};

// #region Medias
export type UpdateMediasAction = {
  type: 'UPDATE_MEDIAS';
  payload: SourceMedia[];
};

export type UpdateMediaImageAnimationAction = {
  type: 'UPDATE_MEDIA_IMAGE_ANIMATION';
  payload: MediaAnimations | null;
};

export type UpdateAllMediaImagesAnimationAction = {
  type: 'UPDATE_ALL_IMAGES_MEDIA_ANIMATION';
  payload: { animation: MediaAnimations | null; duration: number };
};

export type UpdateMediaImageDurationnAction = {
  type: 'UPDATE_MEDIA_IMAGE_DURATION';
  payload: number;
};

export type UpdateMediaFilterAction = {
  type: 'UPDATE_MEDIA_FILTER';
  payload: Filter | null;
};

export type UpdateAllMediaFilterAction = {
  type: 'UPDATE_ALL_MEDIA_FILTER';
  payload: Filter | null;
};

export type UpdateMediaEditionParameters = {
  type: 'UPDATE_MEDIA_EDITION_PARAMETERS';
  payload: EditionParameters | null;
};

export type UpdateAllMediasEditionParameters = {
  type: 'UPDATE_ALL_MEDIA_EDITION_PARAMETERS';
  payload: EditionParameters | null;
};

export type UpdateActiveMediaAction = {
  type: 'UPDATE_ACTIVE_MEDIA';
  payload: SourceMedia;
};

export type UpdateMediasTransitionAction = {
  type: 'UPDATE_MEDIA_TRANSITION';
  payload: CoverTransitions | null;
};

export type UpdateCurrentVideoTimeRangeAction = {
  type: 'UPDATE_CURRENT_VIDEO_TIME_RANGE';
  payload: TimeRange;
};

// #endregion

// #region TextLayer
export type AddTextLayerAction = {
  type: 'ADD_TEXT_LAYER';
  payload: {
    text: string;
    fontFamily: string;
    fontSize: number;
    textAlign: 'center' | 'left' | 'right';
    color: string;
  };
};

export type UpdateTextLayerAction = {
  type: 'UPDATE_TEXT_LAYER';
  payload: Partial<CoverEditorTextLayerItem>;
};
// #endregion

// #region OverlayLayer
export type AddOverlayLayerAction = {
  type: 'ADD_OVERLAY_LAYER';
  payload: SourceMediaImage;
};

export type UpdateOverlayLayerAction = {
  type: 'UPDATE_OVERLAY_LAYER';
  payload: Partial<CoverEditorOverlayItem>;
};
// #endregion

// #region Links Actions
export type UpdateLinksLayerAction = {
  type: 'UPDATE_LINKS_LAYER';
  payload: Partial<CoverEditorLinksLayerItem>;
};

export type UpdateLinksAction = {
  type: 'UPDATE_LINKS';
  payload: CoverEditorSocialLink[];
};
// #endregion

export type UpdateCurrentLayerColor = {
  type: 'UPDATE_CURRENT_LAYER_COLOR';
  payload: {
    color: string;
  };
};

export type UpdateCurrentLayerSize = {
  type: 'UPDATE_CURRENT_LAYER_SIZE';
  payload: {
    size: number;
  };
};

// #region resources loading actions
export type LoadingStartAction = {
  type: 'LOADING_START';
  payload: {
    remote: boolean;
  };
};

export type LoadingSuccessAction = {
  type: 'LOADING_SUCCESS';
  payload: {
    lutTextures: Partial<Record<Filter, TextureInfo>>;
    images: Record<string, TextureInfo>;
    localFilenames: Record<string, string>;
  };
};

export type LoadingErrorAction = {
  type: 'LOADING_ERROR';
  payload: {
    error: any;
  };
};
// #endregion

export type CoverEditorAction =
  | AddOverlayLayerAction
  | AddTextLayerAction
  | DeleteCurrentLayerAction
  | DuplicateCurrentLayerAction
  | LoadingErrorAction
  | LoadingStartAction
  | LoadingSuccessAction
  | SetEditionModeAction
  | UpdateActiveMediaAction
  | UpdateAllMediaFilterAction
  | UpdateAllMediaImagesAnimationAction
  | UpdateAllMediasEditionParameters
  | UpdateCardColorsAction
  | UpdateCurrentLayerColor
  | UpdateCurrentLayerSize
  | UpdateCurrentVideoTimeRangeAction
  | UpdateLayerBorderAction
  | UpdateLayerShadowAction
  | UpdateLinksAction
  | UpdateLinksLayerAction
  | UpdateMediaEditionParameters
  | UpdateMediaFilterAction
  | UpdateMediaImageAnimationAction
  | UpdateMediaImageDurationnAction
  | UpdateMediasAction
  | UpdateMediasTransitionAction
  | UpdateOverlayLayerAction
  | UpdateTextLayerAction;
