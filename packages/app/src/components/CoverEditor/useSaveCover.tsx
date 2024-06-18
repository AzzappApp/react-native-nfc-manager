import {
  ImageFormat,
  createPicture,
  drawAsImageFromPicture,
} from '@shopify/react-native-skia';
import { useCallback, useState } from 'react';
import { Platform, unstable_batchedUpdates } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import * as mime from 'react-native-mime-types';
import { graphql, useMutation } from 'react-relay';
import {
  exportVideoComposition,
  getValidEncoderConfigurations,
  type VideoCompositionItem,
} from '@azzapp/react-native-skia-video';
import { waitTime } from '@azzapp/shared/asyncHelpers';
import {
  COVER_VIDEO_BITRATE,
  COVER_VIDEO_FRAME_RATE,
  COVER_MEDIA_RESOLUTION,
} from '@azzapp/shared/coverHelpers';
import { createRandomFilePath, getFileName } from '#helpers/fileHelpers';
import {
  getDeviceMaxDecodingResolution,
  reduceVideoResolutionIfNecessary,
} from '#helpers/mediaEditions';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import coverDrawer, { coverTransitions } from './coverDrawer';
import { mediaInfoIsImage } from './coverEditorHelpers';
import coverLocalStore from './coversLocalStore';
import type { useSaveCoverMutation } from '#relayArtifacts/useSaveCoverMutation.graphql';
import type { CoverEditorState } from './coverEditorTypes';
import type { Observable } from 'relay-runtime';

export type SavingStatus =
  | 'complete'
  | 'error'
  | 'exporting'
  | 'saving'
  | 'uploading';

const useSaveCover = (
  webCardId: string,
  coverEditorState: CoverEditorState,
) => {
  const [savingStatus, setSavingStatus] = useState<SavingStatus | null>(null);
  const [error, setError] = useState<any>(null);
  const [progressIndicator, setProgressIndicator] =
    useState<Observable<number> | null>(null);
  const [commit] = useMutation<useSaveCoverMutation>(graphql`
    mutation useSaveCoverMutation($webCardId: ID!, $input: SaveCoverInput!) {
      saveCover(webCardId: $webCardId, input: $input) {
        webCard {
          hasCover
          coverId
          ...CoverRenderer_webCard
        }
      }
    }
  `);

  const save = useCallback(async () => {
    setSavingStatus('exporting');

    // we need to be sure that the cover rendering is stopped
    // before we start exporting the cover
    await waitTime(Platform.OS === 'android' ? 1000 : 100);

    let path: string;
    let kind: 'image' | 'video';
    try {
      ({ path, kind } = await createCoverMedia(coverEditorState));
    } catch (error) {
      setSavingStatus('error');
      setError(error);
      return;
    }

    const { uploadURL, uploadParameters } = await uploadSign({
      kind: kind === 'video' ? 'video' : 'image',
      target: 'cover',
    });
    const fileName = getFileName(path);
    const file: any = {
      name: fileName,
      uri: `file://${path}`,
      type:
        mime.lookup(fileName) ||
        (kind === 'image' ? 'image/jpeg' : 'video/mp4'),
    };
    const { progress: uploadProgress, promise: uploadPromise } = uploadMedia(
      file,
      uploadURL,
      uploadParameters,
    );
    unstable_batchedUpdates(() => {
      setSavingStatus('uploading');
      setProgressIndicator(
        uploadProgress.map(({ loaded, total }) => loaded / total),
      );
    });
    const { public_id } = await uploadPromise;
    setSavingStatus('saving');

    const texts = coverEditorState.textLayers.map(({ text }) => text);
    const { backgroundColor, cardColors } = coverEditorState;

    try {
      await new Promise<void>((resolve, reject) => {
        commit({
          variables: {
            webCardId,
            input: {
              mediaId: public_id,
              texts,
              backgroundColor: backgroundColor ?? 'light',
              cardColors,
              dynamicLinks: coverEditorState.linksLayer,
            },
          },
          onCompleted(response, error) {
            coverLocalStore.saveCover({
              ...coverEditorState,
              coverId: response.saveCover?.webCard.coverId,
            });

            if (error) {
              reject(error);
              return;
            }
            resolve();
          },
          onError(error) {
            reject(error);
          },
        });
      });
    } catch (error) {
      unstable_batchedUpdates(() => {
        setSavingStatus('error');
        setError(error);
        setProgressIndicator(null);
      });
      throw error;
    }
    unstable_batchedUpdates(() => {
      setSavingStatus('complete');
      setProgressIndicator(null);
    });
  }, [commit, coverEditorState, webCardId]);

  const reset = useCallback(() => {
    unstable_batchedUpdates(() => {
      setSavingStatus(null);
      setError(null);
      setProgressIndicator(null);
    });
  }, []);

  return {
    save,
    reset,
    canSave: isCoverEditorStateValid(coverEditorState),
    savingStatus,
    progressIndicator,
    error,
  };
};

export default useSaveCover;

const isCoverEditorStateValid = (coverEditorState: CoverEditorState) => {
  const {
    medias,
    overlayLayers,
    loadingLocalMedia,
    loadingRemoteMedia,
    images,
    videoPaths,
  } = coverEditorState;

  // we'll see if we need to add more validation here
  return (
    medias.length > 0 &&
    !loadingLocalMedia &&
    !loadingRemoteMedia &&
    medias.every(mediaInfo => {
      if (mediaInfoIsImage(mediaInfo)) {
        return images[mediaInfo.media.uri] != null;
      } else {
        return videoPaths[mediaInfo.media.uri] != null;
      }
    }) &&
    overlayLayers.every(overlayLayer => images[overlayLayer.media.uri] != null)
  );
};

const createCoverMedia = async (coverEditorState: CoverEditorState) => {
  const {
    coverTransition,
    medias,

    images,
    videoPaths,
    lutShaders,
    loadingLocalMedia,
    loadingRemoteMedia,
  } = coverEditorState;

  if (loadingLocalMedia || loadingRemoteMedia) {
    throw new Error('Cannot save cover while media is loading');
  }

  const isDynamic =
    medias.some(
      mediaInfo => !mediaInfoIsImage(mediaInfo) || mediaInfo.animation != null,
    ) || medias.length > 1;

  let outPath: string;

  if (!isDynamic) {
    outPath = createRandomFilePath('jpg');
    const image = drawAsImageFromPicture(
      createPicture(canvas => {
        coverDrawer({
          canvas,
          ...COVER_MEDIA_RESOLUTION,
          frames: {},
          currentTime: 0,
          videoScales: {},

          coverEditorState,
          images,
          lutShaders,
        });
      }),
      COVER_MEDIA_RESOLUTION,
    );

    const blob = await image.encodeToBase64(ImageFormat.JPEG, 95);

    await ReactNativeBlobUtil.fs.writeFile(outPath, blob, 'base64');
  } else {
    outPath = createRandomFilePath('mp4');
    let duration = 0;
    const videoScales: Record<string, number> = {};
    const items: VideoCompositionItem[] = [];
    const transitionDuration =
      (coverTransition && coverTransitions[coverTransition]?.duration) || 0;
    for (const mediaInfo of medias) {
      duration = Math.max(0, duration - transitionDuration);
      if (mediaInfoIsImage(mediaInfo)) {
        duration += mediaInfo.duration;
      } else {
        const { media, timeRange } = mediaInfo;
        const path = videoPaths[media.uri];
        const itemDuration = timeRange.duration;
        const { resolution, videoScale } = reduceVideoResolutionIfNecessary(
          media.width,
          media.height,
          media.rotation,
          getDeviceMaxDecodingResolution(path, MAX_EXPORT_DECODER_RESOLUTION),
        );
        videoScales[media.uri] = videoScale;
        items.push({
          id: media.uri,
          path,
          startTime: timeRange.startTime,
          compositionStartTime: duration,
          duration: itemDuration,
          resolution,
        });
        duration += itemDuration;
      }
    }

    const requestedConfigs = {
      ...COVER_MEDIA_RESOLUTION,
      bitRate: COVER_VIDEO_BITRATE,
      frameRate: COVER_VIDEO_FRAME_RATE,
    };

    const validConfigs =
      Platform.OS === 'android'
        ? getValidEncoderConfigurations(
            requestedConfigs.width,
            requestedConfigs.height,
            requestedConfigs.frameRate,
            requestedConfigs.bitRate,
          )
        : [requestedConfigs];
    if (!validConfigs || validConfigs.length === 0) {
      throw new Error('No valid encoder configuration found');
    }

    const encoderConfigs = validConfigs[0]!;

    await exportVideoComposition(
      { duration, items },
      {
        outPath,
        ...encoderConfigs,
      },
      infos => {
        'worklet';
        coverDrawer({
          ...infos,
          coverEditorState,
          images,
          lutShaders,
          videoScales,
        });
      },
    );
  }

  return { path: outPath, kind: isDynamic ? 'video' : 'image' } as const;
};

const MAX_EXPORT_DECODER_RESOLUTION = 1920;
