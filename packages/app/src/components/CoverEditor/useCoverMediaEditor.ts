import { mapValues } from 'lodash';
import { useCallback, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-native';
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
import type { MaskMedia, SourceMedia, TemplateKind } from './coverEditorTypes';

const useCoverMediaEditor = (
  initialData: {
    sourceMedia?: SourceMedia | null;
    maskMedia?: MaskMedia | null;
    mediaCropParameters?: EditionParameters | null;
  } | null,
) => {
  const [sourceMedia, setSourceMedia] = useState<SourceMedia | null>(
    initialData?.sourceMedia ?? null,
  );

  const [maskMedia, setMaskMedia] = useState<MaskMedia | null>(
    initialData?.maskMedia ?? null,
  );

  const [mediaCropParameters, setMediaCropParameters] =
    useState<EditionParameters | null>(
      initialData?.mediaCropParameters ?? null,
    );

  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);

  const [mediaComputation, setMediaComputation] =
    useState<MaskComputation | null>(null);
  const [mediaComputationError, setMediaComputationError] = useState<any>(null);
  const lastComputedMedia = useRef<ImagePickerResult | null>(null);

  const startMediaComputation = useCallback(
    (result: ImagePickerResult) => {
      lastComputedMedia.current = result;
      const { uri, kind, width, height, editionParameters, timeRange } = result;
      if (mediaComputation) {
        mediaComputation.cancel();
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
        kind === 'image' && maskMedia?.source !== uri;

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
        setMediaComputation(mediaComputation);

        mediaComputation.promise
          .then(result => {
            if (result === 'canceled') {
              return;
            }
            const { media, editionParameters, maskURI } = result;
            unstable_batchedUpdates(() => {
              setSourceMedia(media);
              setMediaCropParameters(
                extractLayoutParameters(editionParameters)[0],
              );
              setMaskMedia(maskURI ? { uri: maskURI, source: uri } : null);
              setMediaComputation(null);
              setTimeRange(null);
            });
          })
          .catch(err => {
            setMediaComputationError(err);
          });
      }
    },
    [maskMedia?.source, mediaComputation],
  );

  const retryMediaComputation = useCallback(() => {
    if (lastComputedMedia.current) {
      startMediaComputation(lastComputedMedia.current);
    }
  }, [startMediaComputation]);

  const setSourceMediaFromImagePicker = useCallback(
    (result: ImagePickerResult) => {
      unstable_batchedUpdates(async () => {
        const { uri, kind, width, height, editionParameters, timeRange } =
          result;
        setSourceMedia({ uri, kind, width, height });
        setMediaCropParameters(extractLayoutParameters(editionParameters)[0]);
        setTimeRange(timeRange ?? null);
        startMediaComputation(result);
      });
    },
    [startMediaComputation],
  );

  return {
    sourceMedia,
    maskMedia,
    mediaCropParameters,
    timeRange,
    mediaComputing: mediaComputation != null,
    mediaComputationError,
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
