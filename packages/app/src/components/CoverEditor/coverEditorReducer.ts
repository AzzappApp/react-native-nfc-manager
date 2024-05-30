/* eslint-disable no-case-declarations */
import {
  COVER_MAX_MEDIA_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import { cropDataForAspectRatio } from '#helpers/mediaEditions';
import { mediaInfoIsImage } from './coverEditorHelpers';
import type { CoverEditorAction } from './coverEditorActions';
import type { CoverEditorState } from './coverEditorTypes';

export function coverEditorReducer(
  state: CoverEditorState,
  action: CoverEditorAction,
): CoverEditorState {
  const { type, payload } = action;

  const selectedTextLayerIndex =
    state.layerMode === 'text' ? state.selectedLayerIndex : null;

  const textLayers = [...state.textLayers];

  switch (type) {
    case 'SELECT_LAYER':
      return {
        ...state,
        layerMode: payload.layerMode,
        selectedLayerIndex: payload.index,
      };
    case 'ADD_TEXT_LAYER':
      return {
        ...state,
        textLayers: [...state.textLayers, payload],
        selectedLayerIndex: state.textLayers.length,
        layerMode: 'text',
      };
    case 'CHANGE_ALIGNMENT':
      if (selectedTextLayerIndex === null) return state;
      textLayers[selectedTextLayerIndex].style.textAlign = payload.alignment;

      return {
        ...state,
        textLayers,
      };
    case 'CHANGE_FONT_SIZE':
      if (state.layerMode === 'links') {
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
    case 'CHANGE_FONT_FAMILY':
      if (selectedTextLayerIndex === null) return state;
      textLayers[selectedTextLayerIndex].style.fontFamily = payload.fontFamily;

      return {
        ...state,
        textLayers,
      };
    case 'CHANGE_FONT_COLOR':
      if (state.layerMode === 'links') {
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
    case 'DUPLICATE':
      if (selectedTextLayerIndex === null || textLayers.length >= 3)
        return state;

      textLayers.push({ ...textLayers[selectedTextLayerIndex] });

      return {
        ...state,
        textLayers,
      };
    case 'DELETE':
      if (state.layerMode === 'links') {
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
    case 'ADD_OVERLAY_LAYER':
      const totalDuration = state.medias.reduce(
        (acc, media) =>
          acc +
          (mediaInfoIsImage(media) ? media.duration : media.timeRange.duration),
        0,
      );
      return {
        ...state,
        overlayLayer: {
          media: payload,
          style: {
            borderColor: colors.black,
            borderRadius: 0,
            borderWidth: 0,
            elevation: 0,
          },
          animation: { id: 'none', start: 0, duration: totalDuration }, //define this value based on total
          filter: null,
          editionParameters: null,
        },
        layerMode: 'overlay',
        selectedLayerIndex: null,
      };
    case 'UPDATE_OVERLAY_LAYER':
      if (state.overlayLayer == null) return state;
      return {
        ...state,
        overlayLayer: {
          ...state.overlayLayer,
          ...payload,
        },
      };
    case 'UPDATE_LAYER_BORDER':
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
    case 'UPDATE_LAYER_SHADOW':
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
    case 'UPDATE_MEDIA_ANIMATION':
      if (state.layerMode === 'overlay') {
        if (state.overlayLayer == null) return state;
        return {
          ...state,
          overlayLayer: {
            ...state.overlayLayer,
            animation: { ...state.overlayLayer.animation, ...payload },
          },
        };
      } else if (
        state.layerMode === 'mediaEdit' &&
        state.selectedLayerIndex != null
      ) {
        const newMedias = [...state.medias]; //making a new array
        const media = state.medias[state.selectedLayerIndex];
        if (mediaInfoIsImage(media)) {
          newMedias[state.selectedLayerIndex] = {
            ...media,
            animation: payload.id,
            duration: payload.duration,
          };
        }
        return {
          ...state,
          medias: newMedias,
        };
      } else {
        console.warn(
          `Update animation on ${state.layerMode} is not implemented`,
        );
        return state;
      }
    case 'UPDATE_MEDIA_FILTER':
      if (state.layerMode === 'overlay') {
        if (state.overlayLayer == null) return state;
        return {
          ...state,
          overlayLayer: {
            ...state.overlayLayer,
            filter: payload,
          },
        };
      } else if (
        state.layerMode === 'mediaEdit' &&
        state.selectedLayerIndex != null
      ) {
        const newMedias = [...state.medias]; //making a new array
        const media = state.medias[state.selectedLayerIndex];
        newMedias[state.selectedLayerIndex] = {
          ...media,
          filter: payload,
        };
        return {
          ...state,
          medias: newMedias,
        };
      } else {
        console.warn(
          `Update Filter effect on ${state.layerMode} is not implemented`,
        );
        return state;
      }
    case 'DELETE_OVERLAY_LAYER':
      if (state.overlayLayer == null) return state;
      return {
        ...state,
        overlayLayer: null,
        layerMode: null,
      };
    case 'UPDATE_LINKS':
      return {
        ...state,
        linksLayer: {
          ...state.linksLayer,
          links: payload,
        },
      };
    case 'UPDATE_ACTIVE_MEDIA': {
      if (state.layerMode === 'overlay' && payload.kind === 'image') {
        return {
          ...state,
          overlayLayer: {
            ...state.overlayLayer!,
            media: payload,
          },
        };
      }

      return state;
    }
    case 'UPDATE_MEDIA_TRANSITION': {
      return {
        ...state,
        coverTransition: payload,
      };
    }
    case 'UPDATE_MEDIAS':
      return {
        ...state,
        medias: payload.map(media => {
          const mediaInfo = state.medias.find(
            info => info.media.uri === media.uri,
          );
          if (mediaInfo) {
            return mediaInfo;
          }
          const cropData = cropDataForAspectRatio(
            media.width,
            media.height,
            COVER_RATIO,
          );
          if (media.kind === 'image') {
            return {
              media,
              filter: null,
              animation: 'none',
              editionParameters: { cropData },
              duration: COVER_MAX_MEDIA_DURATION,
            };
          } else {
            return {
              media,
              filter: null,
              animation: 'none',
              editionParameters: { cropData },
              timeRange: {
                startTime: 0,
                duration: Math.min(COVER_MAX_MEDIA_DURATION, media.duration),
              },
            };
          }
        }),
      };
    case 'LOADING_START':
      return {
        ...state,
        loadingRemoteMedia: payload.remote,
        loadingLocalMedia: !payload.remote,
      };
    case 'LOADING_ERROR': {
      console.error(payload.error);
      // TODO handle error
      return state;
    }
    case 'LOADING_SUCCESS': {
      const { images, lutShaders, videoPaths } = payload;
      return {
        ...state,
        loadingRemoteMedia: false,
        loadingLocalMedia: false,
        images,
        lutShaders,
        videoPaths,
      };
    }
    default:
      return state;
  }
}
