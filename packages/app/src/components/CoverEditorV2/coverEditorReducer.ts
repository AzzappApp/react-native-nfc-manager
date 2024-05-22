/* eslint-disable no-case-declarations */
import { colors } from '#theme';
import {
  CoverEditorActionType,
  type CoverEditorAction,
} from './coverEditorActions';
import type {
  CoverEditorLinksLayerItem,
  CoverEditorOverlayItem,
  CoverEditorSelectedLayer,
  CoverEditorTextLayerItem,
  CoverLayerType,
} from './CoverTypes';

export type CoverEditorState = {
  selectedLayer: CoverEditorSelectedLayer;
  textLayers: CoverEditorTextLayerItem[];
  overlayLayer: CoverEditorOverlayItem | null;
  layerMode: CoverLayerType; //add it here instead of animated value in context  because It could been use for reducer action in some case. TO IMPROVE
  linksLayer: CoverEditorLinksLayerItem;
};

export function coverEditorReducer(
  state: CoverEditorState,
  action: CoverEditorAction,
): CoverEditorState {
  const { type, payload } = action;

  const selectedTextLayerIndex =
    state.selectedLayer?.type === 'text' ? state.selectedLayer.index : null;

  const textLayers = [...state.textLayers];

  switch (type) {
    case CoverEditorActionType.SetLayerMode:
      return {
        ...state,
        layerMode: payload,
      };
    case CoverEditorActionType.AddTextLayer:
      return {
        ...state,
        textLayers: [...state.textLayers, payload],
      };
    case CoverEditorActionType.SelectLayer:
      return {
        ...state,
        selectedLayer: payload,
        layerMode: payload?.type ?? null,
      };
    case CoverEditorActionType.ChangeAlignment:
      if (selectedTextLayerIndex === null) return state;
      textLayers[selectedTextLayerIndex].style.textAlign = payload.alignment;

      return {
        ...state,
        textLayers,
      };
    case CoverEditorActionType.ChangeFontSize:
      if (state.selectedLayer?.type === 'links') {
        return {
          ...state,
          linksLayer: {
            ...state.linksLayer,
            style: {
              ...state.linksLayer.style,
              size: payload.fontSize,
            },
          },
        };
      }
      if (selectedTextLayerIndex !== null) {
        textLayers[selectedTextLayerIndex] = {
          ...textLayers[selectedTextLayerIndex],
          style: {
            ...textLayers[selectedTextLayerIndex].style,
            fontSize: payload.fontSize,
          },
        };

        return {
          ...state,
          textLayers,
        };
      }
      return state;
    case CoverEditorActionType.ChangeFontFamily:
      if (selectedTextLayerIndex === null) return state;
      textLayers[selectedTextLayerIndex].style.fontFamily = payload.fontFamily;

      return {
        ...state,
        textLayers,
      };
    case CoverEditorActionType.ChangeFontColor:
      if (state.selectedLayer?.type === 'links') {
        return {
          ...state,
          linksLayer: {
            ...state.linksLayer,
            style: {
              ...state.linksLayer.style,
              color: payload.fontColor,
            },
          },
        };
      }

      if (selectedTextLayerIndex !== null) {
        textLayers[selectedTextLayerIndex] = {
          ...textLayers[selectedTextLayerIndex],
          style: {
            ...textLayers[selectedTextLayerIndex].style,
            color: payload.fontColor,
          },
        };

        return {
          ...state,
          textLayers,
        };
      }
      return state;
    case CoverEditorActionType.Duplicate:
      if (selectedTextLayerIndex === null || textLayers.length >= 3)
        return state;

      textLayers.push({ ...textLayers[selectedTextLayerIndex] });

      return {
        ...state,
        textLayers,
      };
    case CoverEditorActionType.Delete:
      if (state.selectedLayer?.type === 'links') {
        return {
          ...state,
          linksLayer: {
            ...state.linksLayer,
            links: [],
          },
        };
      }

      if (selectedTextLayerIndex !== null) {
        textLayers.splice(selectedTextLayerIndex, 1);

        return {
          ...state,
          textLayers,
        };
      }

      return state;
    //#Region OverlayLayer
    case CoverEditorActionType.AddOverlayLayer:
      return {
        ...state,
        overlayLayer: {
          ...payload,
          style: {
            borderColor: colors.black,
            borderRadius: 0,
            borderWidth: 0,
            elevation: 0,
          },
          filter: null,
        },
        selectedLayer: { type: 'overlay' },
      };
    case CoverEditorActionType.UpdateOverlayLayer:
      if (state.overlayLayer == null) return state;
      return {
        ...state,
        overlayLayer: {
          ...state.overlayLayer,
          ...payload,
        },
      };
    case CoverEditorActionType.UpdateLayerBorder:
      //IMPROVE the way of updating the correct layer more generic not listing all case
      //maybe renaming overlayer to some name as CoverType and use something like
      // [layerMode] : {
      //
      //}
      if (state.layerMode === 'overlay') {
        if (state.overlayLayer == null) return state;
        return {
          ...state,
          overlayLayer: {
            ...state.overlayLayer,
            style: { ...state.overlayLayer.style, ...payload },
          },
        };
      } else return state;
    case CoverEditorActionType.UpdateLayerShadow:
      //IMPROVE the way of updating the correct layer more generic not listing all case
      //maybe renaming overlayer to some name as CoverType and use something like
      // [layerMode] : {
      //
      //}
      if (state.layerMode === 'overlay') {
        if (state.overlayLayer == null) return state;
        return {
          ...state,
          overlayLayer: {
            ...state.overlayLayer,
            style: { ...state.overlayLayer.style, ...payload },
          },
        };
      } else return state;
    case CoverEditorActionType.UpdateLayerAnimation:
      //IMPROVE the way of updating the correct layer more generic not listing all case
      //maybe renaming overlayer to some name as CoverType and use something like
      // [layerMode] : {
      //
      //}
      if (state.layerMode === 'overlay') {
        if (state.overlayLayer == null) return state;
        return {
          ...state,
          overlayLayer: {
            ...state.overlayLayer,
            animation:
              payload == null
                ? null
                : { ...state.overlayLayer.animation, ...payload },
          },
        };
      } else return state;
    case CoverEditorActionType.UpdateLayerFilter:
      //IMPROVE the way of updating the correct layer more generic not listing all case
      //maybe renaming overlayer to some name as CoverType and use something like
      // [layerMode] : {
      //
      //}
      if (state.layerMode === 'overlay') {
        if (state.overlayLayer == null) return state;
        return {
          ...state,
          overlayLayer: {
            ...state.overlayLayer,
            filter: payload,
          },
        };
      } else return state;
    case CoverEditorActionType.DeleteOverlayLayer:
      if (state.overlayLayer == null) return state;
      return {
        ...state,
        overlayLayer: null,
        layerMode: null,
      };
    case CoverEditorActionType.UpdateLinks:
      return {
        ...state,
        linksLayer: {
          ...state.linksLayer,
          links: payload,
        },
      };
    default:
      return state;
  }
}
