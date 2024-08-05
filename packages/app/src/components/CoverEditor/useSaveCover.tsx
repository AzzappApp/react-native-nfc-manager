import {
  ImageFormat,
  createPicture,
  drawAsImageFromPicture,
} from '@shopify/react-native-skia';
import { FileSystemUploadType, UploadTask } from 'expo-file-system';
import { useCallback, useState } from 'react';
import { Platform, unstable_batchedUpdates } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import * as mime from 'react-native-mime-types';
import { graphql, useMutation } from 'react-relay';
import { Observable } from 'relay-runtime';
import {
  exportVideoComposition,
  getValidEncoderConfigurations,
} from '@azzapp/react-native-skia-video';
import { waitTime } from '@azzapp/shared/asyncHelpers';
import { createRandomFilePath, getFileName } from '#helpers/fileHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadSign } from '#helpers/MobileWebAPI';
import coverDrawer from './coverDrawer';
import {
  mediaInfoIsImage,
  createCoverSkottieWithColorReplacement,
  createCoverVideoComposition,
  extractLottieInfoMemoized,
  isCoverDynamic,
  MAX_EXPORT_DECODER_RESOLUTION,
  COVER_EXPORT_VIDEO_RESOLUTION,
  COVER_VIDEO_BITRATE,
  COVER_VIDEO_FRAME_RATE,
} from './coverEditorHelpers';
import coverLocalStore from './coversLocalStore';
import type { useSaveCoverMutation } from '#relayArtifacts/useSaveCoverMutation.graphql';
import type { CoverEditorState } from './coverEditorTypes';
import type { Sink } from 'relay-runtime/lib/network/RelayObservable';

export type SavingStatus =
  | 'complete'
  | 'error'
  | 'exporting'
  | 'saving'
  | 'uploading';

type ProgressCallback = (progress: {
  framesCompleted: number;
  nbFrames: number;
}) => void;

const useSaveCover = (
  webCardId: string,
  coverEditorState: CoverEditorState,
) => {
  const [savingStatus, setSavingStatus] = useState<SavingStatus | null>(null);
  const [error, setError] = useState<any>(null);
  const [exportProgressIndicator, setExportProgressIndicator] =
    useState<Observable<number> | null>(null);
  const [uploadProgressIndicator, setUploadProgressIndicator] =
    useState<Observable<number> | null>(null);
  const [commit] = useMutation<useSaveCoverMutation>(graphql`
    mutation useSaveCoverMutation($webCardId: ID!, $input: SaveCoverInput!) {
      saveCover(webCardId: $webCardId, input: $input) {
        webCard {
          id
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

    let progressSink: Sink<number>;
    const exportProgress: Observable<number> = Observable.create(sink => {
      progressSink = sink;
    });
    setExportProgressIndicator(exportProgress);
    let path: string;
    let kind: 'image' | 'video';
    try {
      ({ path, kind } = await createCoverMedia(
        coverEditorState,
        ({ framesCompleted, nbFrames }) => {
          progressSink?.next(framesCompleted / nbFrames);
        },
      ));
    } catch (error) {
      unstable_batchedUpdates(() => {
        setSavingStatus('error');
        setError(error);
        setExportProgressIndicator(null);
        setUploadProgressIndicator(null);
      });
      throw error;
    }

    const { uploadURL, uploadParameters } = await uploadSign({
      kind: kind === 'video' ? 'video' : 'image',
      target: 'cover',
    });
    const uri = `file://${path}`;
    let uploadProgressSink: Sink<number>;
    const uploadProgress: Observable<number> = Observable.create(sink => {
      uploadProgressSink = sink;
    });

    const uploadTask = new UploadTask(
      uploadURL,
      uri,
      {
        uploadType: FileSystemUploadType.MULTIPART,
        httpMethod: 'POST',
        fieldName: 'file',
        mimeType:
          mime.lookup(getFileName(path)) ||
          (kind === 'image' ? 'image/jpeg' : 'video/mp4'),
        parameters: Object.fromEntries(
          Object.entries(uploadParameters).map(([key, value]) => [
            key,
            value.toString(),
          ]),
        ),
      },
      ({ totalBytesSent, totalBytesExpectedToSend }) => {
        uploadProgressSink?.next(totalBytesSent / totalBytesExpectedToSend);
      },
    );

    unstable_batchedUpdates(() => {
      setSavingStatus('uploading');
      setUploadProgressIndicator(uploadProgress);
    });
    const result = await uploadTask.uploadAsync();
    if (!result) {
      throw new Error('Error uploading media');
    }
    const { public_id } = JSON.parse(result.body);

    addLocalCachedMediaFile(public_id, kind, uri);

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
            coverLocalStore.saveCover(webCardId, {
              ...coverEditorState,
              coverId: response?.saveCover?.webCard.coverId,
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
        setExportProgressIndicator(null);
        setUploadProgressIndicator(null);
      });
      throw error;
    }
    unstable_batchedUpdates(() => {
      setSavingStatus('complete');
      setExportProgressIndicator(null);
      setUploadProgressIndicator(null);
    });
  }, [commit, coverEditorState, webCardId]);

  const reset = useCallback(() => {
    unstable_batchedUpdates(() => {
      setSavingStatus(null);
      setError(null);
      setExportProgressIndicator(null);
      setUploadProgressIndicator(null);
    });
  }, []);

  return {
    save,
    reset,
    canSave: isCoverEditorStateValid(coverEditorState),
    savingStatus,
    exportProgressIndicator,
    uploadProgressIndicator,
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

const createCoverMedia = async (
  coverEditorState: CoverEditorState,
  progressCallback: ProgressCallback,
) => {
  const {
    lottie,
    images,
    lutShaders,
    loadingLocalMedia,
    loadingRemoteMedia,
    cardColors,
  } = coverEditorState;

  if (loadingLocalMedia || loadingRemoteMedia) {
    throw new Error('Cannot save cover while media is loading');
  }

  const isDynamic = isCoverDynamic(coverEditorState);

  let outPath: string;

  if (!isDynamic) {
    outPath = createRandomFilePath('jpg');
    const image = drawAsImageFromPicture(
      createPicture(canvas => {
        coverDrawer({
          canvas,
          ...COVER_EXPORT_VIDEO_RESOLUTION,
          frames: {},
          currentTime: 0,
          videoScales: {},

          coverEditorState,
          images,
          lutShaders,
          videoComposition: { duration: 0, items: [] },
        });
      }),
      COVER_EXPORT_VIDEO_RESOLUTION,
    );

    const blob = await image.encodeToBase64(ImageFormat.JPEG, 95);

    progressCallback({
      nbFrames: 1,
      framesCompleted: 1,
    });
    await ReactNativeBlobUtil.fs.writeFile(outPath, blob, 'base64');
  } else {
    outPath = createRandomFilePath('mp4');

    const { composition, videoScales } = createCoverVideoComposition(
      coverEditorState,
      MAX_EXPORT_DECODER_RESOLUTION,
    );

    const requestedConfigs = {
      ...COVER_EXPORT_VIDEO_RESOLUTION,
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
    const skottiePlayer = createCoverSkottieWithColorReplacement(
      lottie,
      cardColors,
    );

    const lottieInfo = extractLottieInfoMemoized(lottie);
    await exportVideoComposition(
      composition,
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
          skottiePlayer,
          lottieInfo,
        });
      },
      ({ framesCompleted, nbFrames }) => {
        progressCallback({ framesCompleted, nbFrames });
      },
    );
    skottiePlayer?.dispose();
  }

  return { path: outPath, kind: isDynamic ? 'video' : 'image' } as const;
};
