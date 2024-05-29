import type { Media } from '#helpers/mediaHelpers';
import type {
  CoverEditorAnimationItem,
  CoverEditorOverlayItem,
  CoverEditorSelectedLayer,
  CoverEditorSocialLink,
  CoverLayerType,
  CoverTextLayerStyle,
} from './coverEditorTypes';
import type { ShadowStyleIOS } from 'react-native';

/* eslint-disable @typescript-eslint/no-invalid-void-type */
export enum CoverEditorActionType {
  SetLayerMode,
  SelectLayer,
  AddTextLayer,
  ChangeAlignment,
  ChangeFontSize,
  ChangeFontFamily,
  ChangeFontColor,
  Duplicate,
  Delete,
  AddOverlayLayer,
  UpdateOverlayLayer,
  UpdateLayerBorder,
  UpdateLayerShadow,
  UpdateLayerAnimation,
  DeleteOverlayLayer,
  UpdateLayerFilter,
  UpdateLinks,
  UpdateMedias,
}

/**
 * Action to change the layer mode in a cover editor. which will update the bottom menu
 * @property {CoverEditorActionType} type
 * @property {CoverLayerType} payload
 */
export type CoverEditiorSetLayerModeAction = {
  type: CoverEditorActionType.SetLayerMode;
  payload: CoverLayerType;
};

export type CoverEditorSelectLayerAction = {
  type: CoverEditorActionType.SelectLayer;
  payload: CoverEditorSelectedLayer;
};

export type CoverEditorAddTextLayerAction = {
  type: CoverEditorActionType.AddTextLayer;
  payload: {
    text: string;
    style: CoverTextLayerStyle;
  };
};

export type CoverEditorChangeAlignmentAction = {
  type: CoverEditorActionType.ChangeAlignment;
  payload: {
    alignment: 'center' | 'justify' | 'left' | 'right';
  };
};

export type CoverEditorChangeFontSizeAction = {
  type: CoverEditorActionType.ChangeFontSize;
  payload: {
    fontSize: number;
  };
};

export type CoverEditorChangeFontFamilyAction = {
  type: CoverEditorActionType.ChangeFontFamily;
  payload: {
    fontFamily: string;
  };
};

export type CoverEditorChangeFontColorAction = {
  type: CoverEditorActionType.ChangeFontColor;
  payload: {
    fontColor: string;
  };
};

export type CoverEditorDuplicateAction = {
  type: CoverEditorActionType.Duplicate;
  payload: void;
};

export type CoverEditorDeleteAction = {
  type: CoverEditorActionType.Delete;
  payload: void;
};

//#region OverlayLayer
export type CoverEditorAddOverlayLayerAction = {
  type: CoverEditorActionType.AddOverlayLayer;
  payload: {
    uri: string;
    width: number;
    height: number;
  };
};

export type CoverEditionUpdateOverlayLayerAction = {
  type: CoverEditorActionType.UpdateOverlayLayer;
  payload: Partial<CoverEditorOverlayItem>;
};

export type CoverEditionUpdateLayerShadowAction = {
  type: CoverEditorActionType.UpdateLayerShadow;
  payload: { shadow: ShadowStyleIOS | undefined; elevation: number };
};

/**
 * Action to update the border (width, color, radius) of a layer
 * @property {CoverEditorActionType} type
 * @property {CoverLayerType} payload
 */
export type CoverEditionUpdateLayerBorderAction = {
  type: CoverEditorActionType.UpdateLayerBorder;
  payload: Partial<{
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
  }>;
};

export type CoverEditionUpdateLayerAnimationAction = {
  type: CoverEditorActionType.UpdateLayerAnimation;
  payload: Partial<CoverEditorAnimationItem>;
};

export type CoverEditionUpdateLayerFilterAction = {
  type: CoverEditorActionType.UpdateLayerFilter;
  payload: string | null;
};

/**
 * Action to delete the overlya layer
 * @property {CoverEditorActionType} type
 * @property {CoverLayerType} payload
 */
export type CoverEditionUpdateOverlayLayerDeleteAction = {
  type: CoverEditorActionType.DeleteOverlayLayer;
  payload?: null; //typescript error in reducer if payload missing or null
};
//#endregion

export type CoverEditionUpdateLinksAction = {
  type: CoverEditorActionType.UpdateLinks;
  payload: CoverEditorSocialLink[];
};

export type CoverEditionUpdateMediasAction = {
  type: CoverEditorActionType.UpdateMedias;
  payload: Media[];
};

export type CoverEditorAction =
  | CoverEditionUpdateLayerAnimationAction
  | CoverEditionUpdateLayerBorderAction
  | CoverEditionUpdateLayerFilterAction
  | CoverEditionUpdateLayerShadowAction
  | CoverEditionUpdateLinksAction
  | CoverEditionUpdateMediasAction
  | CoverEditionUpdateOverlayLayerAction
  | CoverEditionUpdateOverlayLayerDeleteAction
  | CoverEditiorSetLayerModeAction
  | CoverEditorAddOverlayLayerAction
  | CoverEditorAddTextLayerAction
  | CoverEditorChangeAlignmentAction
  | CoverEditorChangeFontColorAction
  | CoverEditorChangeFontFamilyAction
  | CoverEditorChangeFontSizeAction
  | CoverEditorDeleteAction
  | CoverEditorDuplicateAction
  | CoverEditorSelectLayerAction;
