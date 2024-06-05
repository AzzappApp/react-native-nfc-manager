import type { EditionParameters, Filter } from '#helpers/mediaEditions';
import type { MediaImage, Media, TimeRange } from '#helpers/mediaHelpers';
import type { CoverTransitions } from './coverDrawer/coverTransitions';
import type { Animation } from './coverDrawer/mediaAnimation';
import type {
  CoverEditorOverlayItem,
  CoverEditorSocialLink,
  CoverEditionMode,
  CoverEditorTextLayerItem,
  CardColors,
  MediaInfo,
} from './coverEditorTypes';
import type { SkImage, SkShader } from '@shopify/react-native-skia';

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
  payload: Media[];
};

export type UpdateMediaAnimationAction = {
  type: 'UPDATE_MEDIA_ANIMATION';
  payload: Animation;
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

export type UpdateActiveMediaAction = {
  type: 'UPDATE_ACTIVE_MEDIA';
  payload: MediaInfo;
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
  payload: MediaImage;
};

export type UpdateOverlayLayerAction = {
  type: 'UPDATE_OVERLAY_LAYER';
  payload: Partial<CoverEditorOverlayItem>;
};
// #endregion

// #region Links Actions
export type UpdateLinksAction = {
  type: 'UPDATE_LINKS';
  payload: CoverEditorSocialLink[];
};
// #endregion

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
    lutShaders: Partial<Record<Filter, SkShader>>;
    images: Record<string, SkImage>;
    videoPaths: Record<string, string>;
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
  | UpdateCardColorsAction
  | UpdateCurrentVideoTimeRangeAction
  | UpdateLayerBorderAction
  | UpdateLayerShadowAction
  | UpdateLinksAction
  | UpdateMediaAnimationAction
  | UpdateMediaEditionParameters
  | UpdateMediaFilterAction
  | UpdateMediasAction
  | UpdateMediasTransitionAction
  | UpdateOverlayLayerAction
  | UpdateTextLayerAction;
