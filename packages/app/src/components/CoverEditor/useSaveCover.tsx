import {
  ImageFormat,
  createPicture,
  drawAsImageFromPicture,
  type SkTypefaceFontProvider,
} from '@shopify/react-native-skia';
import { useCallback, useState } from 'react';
import { unstable_batchedUpdates } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import * as mime from 'react-native-mime-types';
import { graphql, useMutation } from 'react-relay';
import {
  exportVideoComposition,
  type VideoCompositionItem,
} from '@azzapp/react-native-skia-video';
import {
  COVER_MAX_MEDIA_DURATION,
  COVER_VIDEO_BITRATE,
  COVER_VIDEO_FRAME_RATE,
  COVER_MEDIA_RESOLUTION,
} from '@azzapp/shared/coverHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { createRandomFilePath, getFileName } from '#helpers/fileHelpers';
import { reduceVideoResolutionIfNecessary } from '#helpers/mediaEditions';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import coverDrawer, { coverTransitions } from './coverDrawer';
import { mediaInfoIsImage } from './coverEditorHelpers';
import coverLocalStore from './coversLocalStore';
import type { useSaveCoverMutation } from '#relayArtifacts/useSaveCoverMutation.graphql';
import type { CoverEditorState } from './coverEditorTypes';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
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
  fontManager: SkTypefaceFontProvider | null,
  cardColors: Readonly<ColorPalette>,
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
          ...CoverRenderer_webCard
        }
      }
    }
  `);

  const save = useCallback(async () => {
    setSavingStatus('exporting');
    coverLocalStore.saveCover(coverEditorState);

    const { path, kind } = await createCoverMedia(
      coverEditorState,
      fontManager,
      cardColors,
    );

    const { uploadURL, uploadParameters } = await uploadSign({
      kind: kind === 'video' ? 'video' : 'image',
      target: 'post',
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
    const { backgroundColor } = coverEditorState;
    commit({
      variables: {
        webCardId,
        input: {
          mediaId: encodeMediaId(public_id, kind),
          texts,
          backgroundColor: backgroundColor ?? 'light',
        },
      },
      onCompleted(response, error) {
        if (error) {
          unstable_batchedUpdates(() => {
            setSavingStatus('error');
            setError(error);
            setProgressIndicator(null);
          });
          return;
        }
        unstable_batchedUpdates(() => {
          setSavingStatus('complete');
          setProgressIndicator(null);
        });
      },
      onError(error) {
        unstable_batchedUpdates(() => {
          setSavingStatus('error');
          setError(error);
          setProgressIndicator(null);
        });
      },
    });
  }, [cardColors, commit, coverEditorState, fontManager, webCardId]);

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
    overlayLayer,
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
    (!overlayLayer || images[overlayLayer.media.uri] != null)
  );
};

const createCoverMedia = async (
  coverEditorState: CoverEditorState,
  fontManager: SkTypefaceFontProvider | null,
  cardColors: ColorPalette,
) => {
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

  const outPath = createRandomFilePath('.mp4');

  if (!isDynamic) {
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
          fontManager,
          cardColors,
        });
      }),
      COVER_MEDIA_RESOLUTION,
    );

    const blob = await image.encodeToBase64(ImageFormat.JPEG, 95);

    const path = createRandomFilePath('jpg');
    await ReactNativeBlobUtil.fs.writeFile(path, blob, 'base64');
  } else {
    let duration = 0;
    const videoScales: Record<string, number> = {};
    const items: VideoCompositionItem[] = [];
    const transitionDuration =
      coverTransitions[coverTransition ?? 'none']?.duration ?? 0;
    for (const { media } of medias) {
      duration = Math.max(0, duration - transitionDuration);
      if (media.kind === 'image') {
        duration += COVER_MAX_MEDIA_DURATION;
      } else if (media.kind === 'video') {
        const path = videoPaths[media.uri];
        const itemDuration = Math.min(media.duration, COVER_MAX_MEDIA_DURATION);
        const { resolution, videoScale } = reduceVideoResolutionIfNecessary(
          media.width,
          media.height,
          media.rotation,
          MAX_EXPORT_DECODER_RESOLUTION,
        );
        videoScales[media.uri] = videoScale;
        items.push({
          id: media.uri,
          path,
          startTime: 0,
          compositionStartTime: duration,
          duration: itemDuration,
          resolution,
        });
        duration += itemDuration;
      }
    }

    await exportVideoComposition(
      { duration, items },
      {
        outPath,
        ...COVER_MEDIA_RESOLUTION,
        bitRate: COVER_VIDEO_BITRATE,
        frameRate: COVER_VIDEO_FRAME_RATE,
      },
      infos => {
        'worklet';
        coverDrawer({
          ...infos,
          coverEditorState,
          images,
          lutShaders,
          videoScales,
          fontManager,
          cardColors,
        });
      },
    );
  }

  return { path: outPath, kind: isDynamic ? 'video' : 'image' };
};

const MAX_EXPORT_DECODER_RESOLUTION = 1920;
