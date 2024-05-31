import type { Animation } from '#components/CoverRenderer/MediaAnimator';
import type { EditionParameters, Filter } from '#helpers/mediaEditions';
import type { MediaImage, Media } from '#helpers/mediaHelpers';
import type {
  CoverEditorOverlayItem,
  CoverEditorSocialLink,
  CoverEditorTransition,
  CoverLayerType,
  CoverTextLayerStyle,
} from './coverEditorTypes';
import type { SkImage, SkShader } from '@shopify/react-native-skia';
import type { ShadowStyleIOS } from 'react-native';

export type SelectLayerAction = {
  type: 'SELECT_LAYER';
  payload: {
    index: number | null;
    layerMode: CoverLayerType;
  };
};

export type AddTextLayerAction = {
  type: 'ADD_TEXT_LAYER';
  payload: {
    text: string;
    style: CoverTextLayerStyle;
  };
};

export type ChangeAlignmentAction = {
  type: 'CHANGE_ALIGNMENT';
  payload: {
    alignment: 'center' | 'justify' | 'left' | 'right';
  };
};

export type ChangeFontSizeAction = {
  type: 'CHANGE_FONT_SIZE';
  payload: {
    fontSize: number;
  };
};

export type ChangeFontFamilyAction = {
  type: 'CHANGE_FONT_FAMILY';
  payload: {
    fontFamily: string;
  };
};

export type ChangeFontColorAction = {
  type: 'CHANGE_FONT_COLOR';
  payload: {
    fontColor: string;
  };
};

export type DuplicateAction = {
  type: 'DUPLICATE';
  payload?: undefined;
};

export type DeleteAction = {
  type: 'DELETE';
  payload?: undefined;
};

//#region OverlayLayer
export type AddOverlayLayerAction = {
  type: 'ADD_OVERLAY_LAYER';
  payload: MediaImage;
};

export type UpdateOverlayLayerAction = {
  type: 'UPDATE_OVERLAY_LAYER';
  payload: Partial<CoverEditorOverlayItem>;
};

export type UpdateLayerShadowAction = {
  type: 'UPDATE_LAYER_SHADOW';
  payload: { shadow: ShadowStyleIOS | undefined; elevation: number };
};

/**
 * Action to update the border (width, color, radius) of a layer
 * @property {CoverEditorActionType} type
 * @property {CoverLayerType} payload
 */
export type UpdateLayerBorderAction = {
  type: 'UPDATE_LAYER_BORDER';
  payload: Partial<{
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
  }>;
};

export type UpdateMediaAnimationAction = {
  type: 'UPDATE_MEDIA_ANIMATION';
  payload: Animation;
};

export type UpdateMediaFilterAction = {
  type: 'UPDATE_MEDIA_FILTER';
  payload: Filter | null;
};

export type UpdateMediaEditionParameters = {
  type: 'UPDATE_MEDIA_EDITION_PARAMETERS';
  payload: EditionParameters | null;
};

/**
 * Action to delete the overlya layer
 * @property {CoverEditorActionType} type
 * @property {CoverLayerType} payload
 */
export type UpdateOverlayLayerDeleteAction = {
  type: 'DELETE_OVERLAY_LAYER';
  payload?: undefined;
};
//#endregion

export type UpdateLinksAction = {
  type: 'UPDATE_LINKS';
  payload: CoverEditorSocialLink[];
};

export type UpdateMediasAction = {
  type: 'UPDATE_MEDIAS';
  payload: Media[];
};

export type UpdateActiveMediaAction = {
  type: 'UPDATE_ACTIVE_MEDIA';
  payload: Media;
};
export type UpdateMediasTransitionAction = {
  type: 'UPDATE_MEDIA_TRANSITION';
  payload: CoverEditorTransition;
};

// #region resources loaded actions
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
  | ChangeAlignmentAction
  | ChangeFontColorAction
  | ChangeFontFamilyAction
  | ChangeFontSizeAction
  | DeleteAction
  | DuplicateAction
  | LoadingErrorAction
  | LoadingStartAction
  | LoadingSuccessAction
  | SelectLayerAction
  | UpdateActiveMediaAction
  | UpdateLayerBorderAction
  | UpdateLayerShadowAction
  | UpdateLinksAction
  | UpdateMediaAnimationAction
  | UpdateMediaEditionParameters
  | UpdateMediaFilterAction
  | UpdateMediasAction
  | UpdateMediasTransitionAction
  | UpdateOverlayLayerAction
  | UpdateOverlayLayerDeleteAction;
