import type {
  CoverEditorAnimationItem,
  CoverEditorOverlayItem,
  CoverEditorSelectedLayer,
  CoverEditorSocialLink,
  CoverLayerType,
  CoverTextLayerStyle,
} from './CoverTypes';
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

export type CoverEditonUpdateOverlayLayerAction = {
  type: CoverEditorActionType.UpdateOverlayLayer;
  payload: Partial<CoverEditorOverlayItem>;
};

export type CoverEditonUpdateLayerShadowAction = {
  type: CoverEditorActionType.UpdateLayerShadow;
  payload: { shadow: ShadowStyleIOS | undefined; elevation: number };
};

/**
 * Action to update the border (width, color, radius) of a layer
 * @property {CoverEditorActionType} type
 * @property {CoverLayerType} payload
 */
export type CoverEditonUpdateLayerBorderAction = {
  type: CoverEditorActionType.UpdateLayerBorder;
  payload: Partial<{
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
  }>;
};

export type CoverEditonUpdateLayerAnimationAction = {
  type: CoverEditorActionType.UpdateLayerAnimation;
  payload: Partial<CoverEditorAnimationItem>;
};

export type CoverEditonUpdateLayerFilterAction = {
  type: CoverEditorActionType.UpdateLayerFilter;
  payload: string | null;
};

/**
 * Action to delete the overlya layer
 * @property {CoverEditorActionType} type
 * @property {CoverLayerType} payload
 */
export type CoverEditonUpdateOverlayLayerDeleteAction = {
  type: CoverEditorActionType.DeleteOverlayLayer;
  payload?: null; //typescript error in reducer if payload missing or null
};
//#endregion

export type CoverEditonUpdateLinksAction = {
  type: CoverEditorActionType.UpdateLinks;
  payload: CoverEditorSocialLink[];
};

export type CoverEditorAction =
  | CoverEditiorSetLayerModeAction
  | CoverEditonUpdateLayerAnimationAction
  | CoverEditonUpdateLayerBorderAction
  | CoverEditonUpdateLayerFilterAction
  | CoverEditonUpdateLayerShadowAction
  | CoverEditonUpdateLinksAction
  | CoverEditonUpdateOverlayLayerAction
  | CoverEditonUpdateOverlayLayerDeleteAction
  | CoverEditorAddOverlayLayerAction
  | CoverEditorAddTextLayerAction
  | CoverEditorChangeAlignmentAction
  | CoverEditorChangeFontColorAction
  | CoverEditorChangeFontFamilyAction
  | CoverEditorChangeFontSizeAction
  | CoverEditorDeleteAction
  | CoverEditorDuplicateAction
  | CoverEditorSelectLayerAction;
