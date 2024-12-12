/* eslint-disable no-case-declarations */
import clamp from 'lodash/clamp';
import {
  COVER_IMAGE_DEFAULT_DURATION,
  COVER_MAX_MEDIA_DURATION,
  COVER_MIN_MEDIA_DURATION,
  COVER_RATIO,
  COVER_VIDEO_DEFAULT_DURATION,
} from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import { cropDataForAspectRatio } from '#helpers/mediaEditions';
import {
  extractLottieInfoMemoized,
  getLottieMediasDurations,
  calculateImageScale,
} from './coverEditorHelpers';
import type { CoverEditorAction } from './coverEditorActions';
import type {
  CoverEditorState,
  CoverMedia,
  CoverMediaImage,
  CoverMediaVideo,
} from './coverEditorTypes';

export function coverEditorReducer(
  state: CoverEditorState,
  action: CoverEditorAction,
): CoverEditorState {
  const { type, payload } = action;

  if (
    !action.type.startsWith?.('LOADING') &&
    action.type !== 'SET_EDITION_MODE' &&
    !state.isModified
  ) {
    state = {
      ...state,
      isModified: true,
    };
  }

  switch (type) {
    // #region Generic Layer Actions
    case 'SET_EDITION_MODE':
      return {
        ...state,
        editionMode: payload.editionMode,
        selectedItemIndex: payload.selectedItemIndex,
      };
    case 'DUPLICATE_CURRENT_LAYER': {
      const { selectedItemIndex, editionMode, textLayers, overlayLayers } =
        state;
      if (
        (editionMode === 'text' || editionMode === 'textEdit') &&
        selectedItemIndex !== null &&
        textLayers[selectedItemIndex] != null
      ) {
        const textLayers = [...state.textLayers];
        const selectedTextLayer = textLayers[selectedItemIndex];
        const deltaOffset = 10;
        const threadhold = 50;
        const xThreshold = threadhold - selectedTextLayer.width / 2;
        const yThreshold = threadhold;

        const newPosition = {
          x:
            selectedTextLayer.position.x < xThreshold
              ? selectedTextLayer.position.x + deltaOffset
              : selectedTextLayer.position.x - deltaOffset,
          y:
            selectedTextLayer.position.y < yThreshold
              ? selectedTextLayer.position.y + deltaOffset
              : selectedTextLayer.position.y - deltaOffset,
        };

        const duplicatedTextLayer = {
          ...textLayers[selectedItemIndex],
          position: newPosition,
        };

        textLayers.push({ ...duplicatedTextLayer });
        return {
          ...state,
          selectedItemIndex: textLayers.length - 1,
          textLayers,
        };
      } else if (
        editionMode === 'overlay' &&
        selectedItemIndex != null &&
        overlayLayers[selectedItemIndex] != null
      ) {
        const overlayLayers = [...state.overlayLayers];
        overlayLayers.push({ ...overlayLayers[selectedItemIndex] });
        return {
          ...state,
          selectedItemIndex: overlayLayers.length - 1,
          overlayLayers,
        };
      }
      console.warn('Duplicate layer without selected layer');
      return state;
    }
    case 'DELETE_CURRENT_LAYER': {
      const {
        selectedItemIndex,
        editionMode,
        overlayLayers,
        textLayers,
        linksLayer,
      } = state;
      if (
        (editionMode === 'text' || editionMode === 'textEdit') &&
        selectedItemIndex !== null &&
        textLayers[selectedItemIndex] !== undefined
      ) {
        const textLayers = [...state.textLayers];
        textLayers.splice(selectedItemIndex, 1);
        return {
          ...state,
          editionMode: 'none',
          selectedItemIndex: null,
          textLayers,
        };
      } else if (
        editionMode === 'overlay' &&
        selectedItemIndex !== null &&
        overlayLayers[selectedItemIndex] !== undefined
      ) {
        const overlayLayers = [...state.overlayLayers];
        overlayLayers.splice(selectedItemIndex, 1);
        return {
          ...state,
          editionMode: 'none',
          selectedItemIndex: null,
          overlayLayers,
        };
      } else if (editionMode === 'links') {
        return {
          ...state,
          editionMode: 'none',
          linksLayer: {
            ...linksLayer,
            links: [],
            position: { x: 50, y: 50 },
          },
        };
      }
      console.warn('Delete layer without selected layer');
      return state;
    }
    case 'UPDATE_LAYER_BORDER':
      if (state.editionMode === 'overlay' && state.selectedItemIndex != null) {
        const overlayLayers = [...state.overlayLayers];
        overlayLayers[state.selectedItemIndex] = {
          ...overlayLayers[state.selectedItemIndex],
          ...payload,
        };
        return {
          ...state,
          overlayLayers,
        };
      }
      console.warn('Update border without selected overlay layer');
      return state;
    case 'UPDATE_LAYER_SHADOW':
      if (state.editionMode === 'overlay' && state.selectedItemIndex != null) {
        const overlayLayers = [...state.overlayLayers];
        overlayLayers[state.selectedItemIndex] = {
          ...overlayLayers[state.selectedItemIndex],
          shadow: payload.enabled,
        };
        return {
          ...state,
          overlayLayers,
        };
      } else if (
        (state.editionMode === 'text' || state.editionMode === 'textEdit') &&
        state.selectedItemIndex != null
      ) {
        const textLayers = [...state.textLayers];
        textLayers[state.selectedItemIndex] = {
          ...textLayers[state.selectedItemIndex],
          shadow: payload.enabled,
        };
        return {
          ...state,
          textLayers,
        };
      } else if (state.editionMode === 'links') {
        return {
          ...state,
          linksLayer: {
            ...state.linksLayer,
            shadow: payload.enabled,
          },
        };
      }
      console.warn('Update shadow without selected layer');
      return state;
    // #endregion

    // #region Colors Actions
    case 'UPDATE_CARD_COLORS':
      return {
        ...state,
        cardColors: payload,
      };
    // #endregion

    // #region Medias Actions
    case 'UPDATE_MEDIAS': {
      const medias: CoverMedia[] = [];
      let imagesScales = state.imagesScales;

      const lottieInfo = extractLottieInfoMemoized(state.lottie);
      const durations = getLottieMediasDurations(lottieInfo);

      payload.forEach((media, index) => {
        const currentMedia = state.medias.find(
          currentMedia => currentMedia.id === media.id,
        );
        if (currentMedia) {
          medias.push(currentMedia);
          return;
        }
        let aspectRatio = COVER_RATIO;
        if (lottieInfo) {
          const asset = lottieInfo?.assetsInfos[index];
          if (!asset) {
            console.error("Too many medias for the template's assets");
          } else {
            aspectRatio = asset.width / asset.height;
          }
        }
        const cropData = cropDataForAspectRatio(
          media.width,
          media.height,
          aspectRatio,
        );
        if (media.kind === 'image') {
          imagesScales = {
            ...imagesScales,
            [media.id]: calculateImageScale(media),
          };
          medias.push({
            ...media,
            filter: null,
            animation: null,
            editionParameters: { cropData },
            duration: COVER_IMAGE_DEFAULT_DURATION,
          });
        } else {
          const duration = durations ? durations[index] : null;

          medias.push({
            ...media,
            filter: null,
            editionParameters: { cropData },
            timeRange: {
              startTime: 0,
              duration:
                duration ??
                Math.min(COVER_VIDEO_DEFAULT_DURATION, media.duration),
            },
          });
        }
      });
      let localFilenames = state.localFilenames;
      Object.keys(localFilenames).forEach(id => {
        if (!medias.find(media => media.id === id)) {
          localFilenames = { ...localFilenames };
          delete localFilenames[id];
        }
      });
      return {
        ...state,
        medias,
        imagesScales,
        localFilenames,
        initialMediaToPick: undefined,
      };
    }
    case 'UPDATE_MEDIA_IMAGE_DURATION': {
      if (
        state.editionMode === 'mediaEdit' &&
        state.selectedItemIndex != null
      ) {
        const media = state.medias[state.selectedItemIndex];
        if (media.kind === 'image') {
          const medias = [...state.medias];
          medias[state.selectedItemIndex] = {
            ...medias[state.selectedItemIndex],
            duration: clamp(
              payload,
              COVER_MIN_MEDIA_DURATION,
              COVER_MAX_MEDIA_DURATION,
            ),
          };

          return {
            ...state,
            medias,
          };
        }
      }
      return state;
    }
    case 'UPDATE_MEDIA_IMAGE_ANIMATION': {
      if (
        state.editionMode === 'mediaEdit' &&
        state.selectedItemIndex != null
      ) {
        //add a control to only update animation for Image media
        const media = state.medias[state.selectedItemIndex];
        if (media.kind === 'image') {
          const medias = [...state.medias];
          medias[state.selectedItemIndex] = {
            ...(medias[state.selectedItemIndex] as CoverMediaImage),
            animation: payload,
          };
          return {
            ...state,
            medias,
          };
        }
      }
      return state;
    }
    case 'UPDATE_ALL_IMAGES_MEDIA_ANIMATION': {
      if (state.editionMode === 'mediaEdit') {
        //add a control to only update animation for Image media
        return {
          ...state,
          medias: state.medias.map(media => {
            if (media.kind === 'image') {
              return {
                ...media,
                animation: payload.animation,
                duration: payload.duration,
              };
            } else return media;
          }),
        };
      }
      return state;
    }
    case 'UPDATE_MEDIA_FILTER': {
      if (
        state.editionMode === 'mediaEdit' &&
        state.selectedItemIndex != null
      ) {
        const medias = [...state.medias];
        medias[state.selectedItemIndex] = {
          ...medias[state.selectedItemIndex],
          filter: payload,
        };
        return {
          ...state,
          medias,
        };
      } else if (
        state.editionMode === 'overlay' &&
        state.selectedItemIndex != null
      ) {
        const overlayLayers = [...state.overlayLayers];
        overlayLayers[state.selectedItemIndex] = {
          ...overlayLayers[state.selectedItemIndex],
          filter: payload,
        };
        return {
          ...state,
          overlayLayers,
        };
      }
      console.warn('Update filter without selected media');
      return state;
    }
    case 'UPDATE_ALL_MEDIA_FILTER': {
      return {
        ...state,
        medias: state.medias.map(media => ({
          ...media,
          filter: payload,
        })),
      };
    }
    case 'UPDATE_MEDIA_EDITION_PARAMETERS': {
      if (
        state.editionMode === 'mediaEdit' &&
        state.selectedItemIndex != null
      ) {
        const medias = [...state.medias];
        medias[state.selectedItemIndex] = {
          ...medias[state.selectedItemIndex],
          editionParameters: payload,
        };
        return {
          ...state,
          medias,
        };
      } else if (
        state.editionMode === 'overlay' &&
        state.selectedItemIndex != null
      ) {
        const overlayLayers = [...state.overlayLayers];
        overlayLayers[state.selectedItemIndex] = {
          ...overlayLayers[state.selectedItemIndex],
          editionParameters: payload,
        };
        return {
          ...state,
          overlayLayers,
        };
      }
      console.warn('Update editionParameters without selected media');
      return state;
    }
    case 'UPDATE_ALL_MEDIA_EDITION_PARAMETERS': {
      if (
        state.editionMode === 'mediaEdit' &&
        state.selectedItemIndex != null
      ) {
        const medias = state.medias.map((media, index) => {
          if (index === state.selectedItemIndex) {
            //apply editions parameters and crop data
            return {
              ...media,
              editionParameters: payload,
            };
          } else {
            return {
              ...media,
              editionParameters: {
                ...payload,
                cropData: media.editionParameters?.cropData,
              },
            };
          }
        });
        return { ...state, medias };
      } else {
        return state;
      }
    }
    case 'UPDATE_CURRENT_VIDEO_TIME_RANGE': {
      if (
        state.editionMode === 'mediaEdit' &&
        state.selectedItemIndex != null
      ) {
        const medias = [...state.medias];
        medias[state.selectedItemIndex] = {
          ...(medias[state.selectedItemIndex] as CoverMediaVideo),
          timeRange: payload,
        };
        return {
          ...state,
          medias,
        };
      }
      console.warn('Update time range without selected media');
      return state;
    }
    case 'UPDATE_ACTIVE_MEDIA': {
      //handle overlay first
      if (
        state.editionMode === 'overlay' &&
        state.selectedItemIndex != null &&
        payload.kind === 'image'
      ) {
        const overlayLayers = [...state.overlayLayers];
        overlayLayers[state.selectedItemIndex] = {
          ...overlayLayers[state.selectedItemIndex],
          ...payload,
        };
        return {
          ...state,
          overlayLayers,
        };
      }
      if (
        !(state.editionMode === 'mediaEdit' && state.selectedItemIndex != null)
      ) {
        return state;
      }
      let aspectRatio = COVER_RATIO;

      const index = state.selectedItemIndex;
      let imagesScales = state.imagesScales;
      const medias = [...state.medias];
      const updatedMedia = medias[state.selectedItemIndex];
      if (state.lottie) {
        const lottieInfo = extractLottieInfoMemoized(state.lottie);
        const asset = lottieInfo?.assetsInfos[index];
        if (!asset) {
          console.error("Too many medias for the template's assets");
        } else {
          aspectRatio = asset.width / asset.height;
        }
      }
      const cropData = cropDataForAspectRatio(
        payload.width,
        payload.height,
        aspectRatio,
      );
      if (payload.kind === 'image') {
        imagesScales = {
          ...imagesScales,
          [payload.id]: calculateImageScale(payload),
        };

        medias[state.selectedItemIndex] = {
          ...payload,
          filter: updatedMedia.filter,
          animation:
            updatedMedia.kind === 'image' ? updatedMedia.animation : null,
          editionParameters: { ...updatedMedia.editionParameters, cropData },

          duration:
            updatedMedia.kind === 'image'
              ? updatedMedia.duration
              : COVER_MAX_MEDIA_DURATION,
        };
      } else {
        const lottieInfo = extractLottieInfoMemoized(state.lottie);
        const durations = lottieInfo
          ? getLottieMediasDurations(lottieInfo)
          : null;
        const duration = durations ? durations[index] : null;

        medias[state.selectedItemIndex] = {
          ...payload,
          filter: updatedMedia.filter,
          editionParameters: { ...updatedMedia.editionParameters, cropData },
          timeRange: {
            startTime: 0,
            duration:
              duration ??
              Math.min(COVER_VIDEO_DEFAULT_DURATION, payload.duration),
          },
        };
      }
      let localFilenames = state.localFilenames;
      Object.keys(localFilenames).forEach(id => {
        if (!medias.find(media => media.id === id)) {
          localFilenames = { ...localFilenames };
          delete localFilenames[id];
        }
      });
      return {
        ...state,
        medias,
        imagesScales,
        localFilenames,
      };
    }
    case 'UPDATE_MEDIA_TRANSITION': {
      return { ...state, coverTransition: payload };
    }
    // #endregion

    // #region TextLayer Actions
    case 'ADD_TEXT_LAYER':
      return {
        ...state,
        textLayers: [
          ...state.textLayers,
          {
            ...payload,
            width: 40,
            position: { x: 30, y: 50 },
            rotation: 0,
            shadow: false,
            animation: null,
            startPercentageTotal: 0,
            endPercentageTotal: 100,
          },
        ],
        selectedItemIndex: state.textLayers.length,
        editionMode: 'text',
      };
    case 'UPDATE_TEXT_LAYER': {
      const { editionMode, selectedItemIndex, textLayers } = state;
      if (
        (editionMode === 'textEdit' || editionMode === 'text') &&
        selectedItemIndex !== null &&
        textLayers[selectedItemIndex] != null
      ) {
        const textLayers = [...state.textLayers];
        textLayers[selectedItemIndex] = {
          ...textLayers[selectedItemIndex],
          ...payload,
        };
        return {
          ...state,
          textLayers,
        };
      }
      console.warn('Update text layer without selected text layer');
      return state;
    }
    // #endregion

    // #region OverlayLayer Actions
    case 'ADD_OVERLAY_LAYER': {
      const aspectRatio = payload.width / payload.height;
      const size =
        aspectRatio > 1
          ? { width: 50, height: (50 / aspectRatio) * COVER_RATIO }
          : { width: (50 * aspectRatio) / COVER_RATIO, height: 50 };
      return {
        ...state,
        imagesScales: {
          ...state.imagesScales,
          [payload.id]: calculateImageScale(payload),
        },
        editionMode: 'overlay',
        selectedItemIndex: state.overlayLayers.length,
        overlayLayers: [
          ...state.overlayLayers,
          {
            ...payload,
            borderColor: colors.black,
            borderRadius: 0,
            borderWidth: 0,
            elevation: 0,
            animation: null,
            startPercentageTotal: 0,
            endPercentageTotal: 100,
            bounds: {
              x: 50,
              y: 50,
              ...size,
            },
            rotation: 0,
            filter: null,
            editionParameters: null,
            shadow: false,
          },
        ],
      };
    }
    case 'UPDATE_OVERLAY_LAYER': {
      const { selectedItemIndex, overlayLayers } = state;
      if (
        selectedItemIndex !== null &&
        overlayLayers[selectedItemIndex] != null
      ) {
        const overlayLayers = [...state.overlayLayers];
        const layer = {
          ...overlayLayers[selectedItemIndex],
          ...payload,
        };
        const boundsAspectRatio =
          (layer.bounds.width / layer.bounds.height) * COVER_RATIO;
        let cropData = layer.editionParameters?.cropData;
        const cropDataAspectRatio = cropData
          ? cropData.width / cropData.height
          : null;
        const naturalAspectRatio = layer.width / layer.height;

        if (
          (cropDataAspectRatio != null &&
            cropDataAspectRatio !== boundsAspectRatio) ||
          (cropDataAspectRatio == null &&
            naturalAspectRatio !== boundsAspectRatio)
        ) {
          cropData = cropDataForAspectRatio(
            layer.width,
            layer.height,
            boundsAspectRatio,
          );
          layer.editionParameters = {
            ...layer.editionParameters,
            roll: 0,
            cropData,
          };
        }
        overlayLayers[selectedItemIndex] = layer;
        return {
          ...state,
          overlayLayers,
        };
      }
      console.warn('Update overlay layer without selected overlay layer');
      return state;
    }
    // #endregion
    case 'UPDATE_CURRENT_LAYER_COLOR':
      if (
        (state.editionMode === 'text' || state.editionMode === 'textEdit') &&
        state.selectedItemIndex !== null &&
        state.textLayers[state.selectedItemIndex] !== undefined
      ) {
        const textLayers = [...state.textLayers];
        textLayers[state.selectedItemIndex] = {
          ...textLayers[state.selectedItemIndex],
          color: payload.color,
        };

        return {
          ...state,
          textLayers,
        };
      }

      if (state.editionMode === 'links') {
        return {
          ...state,
          linksLayer: {
            ...state.linksLayer,
            color: payload.color,
          },
        };
      }

      return state;
    case 'UPDATE_CURRENT_LAYER_SIZE':
      if (
        (state.editionMode === 'text' || state.editionMode === 'textEdit') &&
        state.selectedItemIndex !== null &&
        state.textLayers[state.selectedItemIndex] !== undefined
      ) {
        const textLayers = [...state.textLayers];
        textLayers[state.selectedItemIndex] = {
          ...textLayers[state.selectedItemIndex],
          fontSize: payload.size,
        };

        return {
          ...state,
          textLayers,
        };
      }

      if (state.editionMode === 'links') {
        return {
          ...state,
          linksLayer: {
            ...state.linksLayer,
            size: payload.size,
          },
        };
      }

      return state;

    // #region LinksLayer Actions
    case 'UPDATE_LINKS_LAYER':
      return {
        ...state,
        linksLayer: {
          ...state.linksLayer,
          ...payload,
        },
      };

    case 'UPDATE_LINKS':
      return {
        ...state,
        linksLayer: {
          ...state.linksLayer,
          links: payload,
        },
      };
    // #endregion

    // #region Loading Actions
    case 'LOADING_START':
      return {
        ...state,
        loadingError: null,
        loadingRemoteMedia: payload.remote,
        loadingLocalMedia: !payload.remote,
      };
    case 'LOADING_ERROR':
      return {
        ...state,
        loadingError: payload.error,
        loadingLocalMedia: false,
        loadingRemoteMedia: false,
      };
    case 'LOADING_SUCCESS':
      const { images, lutShaders, localFilenames } = payload;
      return {
        ...state,
        loadingError: null,
        loadingRemoteMedia: false,
        loadingLocalMedia: false,
        images,
        lutShaders,
        localFilenames,
      };
    // #endregion

    default:
      console.warn(`Action type ${type} not implemented`);
      return state;
  }
}
