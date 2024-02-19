import { mapValues } from 'lodash';
import { useCallback, useReducer, useRef } from 'react';
import { Platform } from 'react-native';
import { waitTime } from '@azzapp/shared/asyncHelpers';
import {
  COVER_SOURCE_MAX_IMAGE_DIMENSION,
  COVER_SOURCE_MAX_VIDEO_DIMENSION,
  COVER_VIDEO_BITRATE,
} from '@azzapp/shared/coverHelpers';
import {
  exportLayersToImage,
  exportLayersToVideo,
  extractLayoutParameters,
} from '#components/gpu';
import { downScaleImage, segmentImage } from '#helpers/mediaHelpers';
import type { EditionParameters } from '#components/gpu';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { TimeRange } from '#components/ImagePicker/imagePickerTypes';
import type {
  MaskMedia,
  MediaInfos,
  SourceMedia,
  TemplateKind,
} from './coverEditorTypes';

type CoverMediaEditorState = {
  sourceMedia: SourceMedia | null;
  maskMedia: MaskMedia | null;
  mediaCropParameters: EditionParameters | null;
  timeRange: TimeRange | null;
  mediaComputation: MaskComputation | null;
  mediaComputationError: any;
};

const reducer = (
  state: CoverMediaEditorState,
  action:
    | {
        type: 'SET_MEDIA_COMPUTATION';
        mediaComputation: MaskComputation;
      }
    | {
        type: 'SET_MEDIA_CROP_PARAMETERS';
        mediaCropParameters: EditionParameters | null;
      }
    | {
        type: 'SET_RESULT_COMPUTATION_ERROR';
        mediaComputationError: any;
      }
    | {
        type: 'SET_RESULT_COMPUTATION';
        sourceMedia: SourceMedia;
        mediaCropParameters: EditionParameters;
        maskMedia: MaskMedia | null;
      }
    | {
        type: 'SET_SOURCE_FROM_IMAGE_PICKER';
        sourceMedia: SourceMedia;
        mediaCropParameters: EditionParameters;
        timeRange: TimeRange | null;
      },
) => {
  switch (action.type) {
    case 'SET_MEDIA_COMPUTATION':
    case 'SET_RESULT_COMPUTATION_ERROR':
    case 'SET_MEDIA_CROP_PARAMETERS':
      return {
        ...state,
        ...action,
      };
    case 'SET_SOURCE_FROM_IMAGE_PICKER':
      return {
        ...state,
        ...action,
        mediaComputation: null,
      };
    case 'SET_RESULT_COMPUTATION':
      return {
        ...state,
        ...action,
        mediaComputation: null,
        timeRange: null,
      };

    default:
      return state;
  }
};

const useCoverMediaEditor = (initialData: MediaInfos | null) => {
  const [state, dispatch] = useReducer(reducer, {
    sourceMedia: initialData?.sourceMedia ?? null,
    maskMedia: initialData?.maskMedia ?? null,
    mediaCropParameters: initialData?.mediaCropParameters ?? null,
    timeRange: null,
    mediaComputation: null,
    mediaComputationError: null,
  });

  const lastComputedMedia = useRef<ImagePickerResult | null>(null);

  const startMediaComputation = useCallback(
    (result: ImagePickerResult) => {
      lastComputedMedia.current = result;
      const { uri, kind, width, height, editionParameters, timeRange } = result;
      if (state.mediaComputation) {
        state.mediaComputation.cancel();
      }
      const maxSize =
        kind === 'image'
          ? COVER_SOURCE_MAX_IMAGE_DIMENSION
          : COVER_SOURCE_MAX_VIDEO_DIMENSION;
      // TODO the bitrate/framerate of the video might be too high perhaps
      // we should also check that
      const shouldRecomputeMedia =
        width > maxSize || height > maxSize || timeRange != null;

      const shouldRecomputeMask: boolean =
        kind === 'image' &&
        state.maskMedia?.source !== uri &&
        Platform.OS === 'ios';

      if (shouldRecomputeMedia || shouldRecomputeMask) {
        const mediaComputation = createMediaComputation({
          uri,
          kind,
          width,
          height,
          editionParameters,
          timeRange,
          maxSize,
          computeMask: shouldRecomputeMask,
          downscaleMedia: shouldRecomputeMedia,
        });
        dispatch({ type: 'SET_MEDIA_COMPUTATION', mediaComputation });

        mediaComputation.promise
          .then(result => {
            if (result === 'canceled') {
              return;
            }
            const { media, editionParameters, maskURI } = result;

            dispatch({
              type: 'SET_RESULT_COMPUTATION',
              sourceMedia: media,
              mediaCropParameters:
                extractLayoutParameters(editionParameters)[0],
              maskMedia: maskURI ? { uri: maskURI, source: uri } : null,
            });
          })
          .catch(err => {
            dispatch({
              type: 'SET_RESULT_COMPUTATION_ERROR',
              mediaComputationError: err,
            });
          });
      }
    },
    [state.maskMedia?.source, state.mediaComputation],
  );

  const retryMediaComputation = useCallback(() => {
    if (lastComputedMedia.current) {
      startMediaComputation(lastComputedMedia.current);
    }
  }, [startMediaComputation]);

  const setSourceMediaFromImagePicker = useCallback(
    (result: ImagePickerResult) => {
      const { uri, kind, width, height, editionParameters, timeRange } = result;
      dispatch({
        type: 'SET_SOURCE_FROM_IMAGE_PICKER',
        sourceMedia: { uri, kind, width, height },
        mediaCropParameters: extractLayoutParameters(editionParameters)[0],
        timeRange: timeRange ?? null,
      });
      startMediaComputation(result);
    },
    [startMediaComputation],
  );

  const setMediaCropParameters = useCallback(
    (mediaCropParameters: EditionParameters | null) => {
      dispatch({
        type: 'SET_MEDIA_CROP_PARAMETERS',
        mediaCropParameters,
      });
    },
    [],
  );

  return {
    ...state,
    mediaComputing: state.mediaComputation != null,
    setSourceMediaFromImagePicker,
    retryMediaComputation,
    setMediaCropParameters,
  };
};

export default useCoverMediaEditor;

type MaskComputation = {
  promise: Promise<
    | 'canceled'
    | {
        media: {
          uri: string;
          kind: 'image' | 'video';
          width: number;
          height: number;
        };
        editionParameters: EditionParameters;
        maskURI: string | null;
      }
  >;
  cancel: () => void;
};

const createMediaComputation = ({
  uri,
  kind,
  width,
  height,
  editionParameters,
  timeRange,
  maxSize,
  computeMask,
  downscaleMedia,
}: {
  uri: string;
  kind: 'image' | 'video';
  width: number;
  height: number;
  editionParameters: EditionParameters;
  timeRange: TimeRange | null;
  maxSize: number;
  computeMask: boolean;
  downscaleMedia: boolean;
}): MaskComputation => {
  let canceled = false;
  const computeMedia = async () => {
    if (downscaleMedia) {
      if (kind === 'video' && Platform.OS === 'android') {
        // on Android we need to be sure that the player is released to avoid memory overload
        await waitTime(50);
      }
      const newSize = downScaleImage(width, height, maxSize);
      const resizePath =
        kind === 'image'
          ? await exportLayersToImage({
              layers: [{ kind: 'image', uri }],
              size: newSize,
              format: 'auto',
              quality: 95,
            })
          : await exportLayersToVideo({
              layers: [
                {
                  kind: 'video',
                  uri,
                  startTime: timeRange?.startTime,
                  duration: timeRange?.duration,
                },
              ],
              size: newSize,
              bitRate: COVER_VIDEO_BITRATE,
              removeSound: true,
            });

      uri = `file://${resizePath}`;
      if (editionParameters.cropData) {
        const scale = newSize.width / width;
        editionParameters = {
          ...editionParameters,
          cropData: mapValues(editionParameters.cropData, v => v * scale),
        };
      }
      width = newSize.width;
      height = newSize.height;
    }
    if (canceled) {
      return 'canceled';
    }

    let maskURI: string | null = null;
    if (computeMask) {
      const maskPath = await segmentImage(uri);
      if (maskPath) {
        maskURI = `file://${maskPath}`;
      }
    }
    if (canceled) {
      return 'canceled';
    }
    return {
      media: {
        uri,
        kind,
        width,
        height,
      },
      editionParameters,
      maskURI,
    };
  };

  return {
    promise: computeMedia(),
    cancel: () => {
      canceled = true;
    },
  };
};

export const useTemplateSwitcherCoverMediaEditor = (
  templateKind: TemplateKind,
  initialTemplateKind: TemplateKind,
  initialData: Parameters<typeof useCoverMediaEditor>[0],
) => {
  const people = useCoverMediaEditor(
    initialTemplateKind === 'people' ? initialData : null,
  );
  const video = useCoverMediaEditor(
    initialTemplateKind === 'video' ? initialData : null,
  );
  const others = useCoverMediaEditor(
    initialTemplateKind === 'others' ? initialData : null,
  );

  return templateKind === 'people'
    ? people
    : templateKind === 'video'
      ? video
      : others;
};
