import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  PixelRatio,
  unstable_batchedUpdates,
  View,
} from 'react-native';
import {
  COVER_CARD_RADIUS,
  COVER_MAX_MEDIA_DURATION,
} from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import VideoCompositionRenderer from '#components/VideoCompositionRenderer';
import {
  SKImageLoader,
  loadAllLUTShaders,
  reduceVideoResolutionIfNecessary,
} from '#helpers/mediaEditions';
import { getVideoLocalPath } from '#helpers/mediaHelpers';
import useLatestCallback from '#hooks/useLatestCallback';
import ActivityIndicator from '#ui/ActivityIndicator';
import coverDrawer from './drawing/coverDrawer';
import coverTransitions from './drawing/coverTransitions';
import type { Filter } from '#helpers/mediaEditions';
import type { CoverEditorState } from './coverEditorTypes';
import type {
  FrameDrawer,
  VideoComposition,
  VideoCompositionItem,
} from '@azzapp/react-native-skia-video';
import type { SkImage, SkShader } from '@shopify/react-native-skia';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type CoverPreviewProps = Exclude<ViewProps, 'children'> & {
  cover: CoverEditorState;
  width: number;
  height: number;
  onLoad?: () => void;
  onError?: (error?: Error) => void;
};

const MAX_DISPLAY_DECODER_RESOLUTION = Math.min(
  (Dimensions.get('window').height / 2) * PixelRatio.get(),
  1920,
);

const CoverPreview = ({
  cover,
  width,
  height,
  onError,
  onLoad,
  style,
  ...props
}: CoverPreviewProps) => {
  const { medias } = cover;
  const isDynamic =
    medias.some(({ media }) => media.kind === 'video') || medias.length > 1;

  const [loadingResources, setLoadingResources] = useState(true);
  const [composition, setComposition] = useState<VideoComposition | null>(null);
  const [images, setImages] = useState<Record<string, SkImage | null>>({});
  const [videoScales, setVideoScales] = useState<Record<string, number>>({});
  const [lutShaders, setLutShaders] = useState<Record<Filter, SkShader> | null>(
    null,
  );

  useEffect(() => {
    loadAllLUTShaders().then(setLutShaders);
  }, []);

  const onErrorInner = useLatestCallback(onError);
  const onLoadInner = useLatestCallback(onLoad);
  useEffect(() => {
    let canceled = false;
    const abortController = new AbortController();

    const fetchResources = async () => {
      const resources = await Promise.all(
        medias.map(async ({ media }) =>
          media.kind === 'video'
            ? ({
                id: media.uri,
                kind: 'video',
                path: await getVideoLocalPath(
                  media.uri,
                  abortController.signal,
                ),
              } as const)
            : ({
                id: media.uri,
                kind: 'image',
                image: await SKImageLoader.loadImage(media.uri),
              } as const),
        ),
      );
      if (canceled) {
        return null;
      }
      const images: Record<string, SkImage> = {};
      resources.forEach(resource => {
        if (resource.kind === 'image') {
          SKImageLoader.refImage(resource.id);
          images[resource.id] = resource.image;
        }
      });

      if (!isDynamic) {
        return { images };
      }

      let duration = 0;
      const videoScales: Record<string, number> = {};
      const items: VideoCompositionItem[] = [];
      const transitionDuration =
        coverTransitions[cover.coverTransition ?? 'none']?.duration ?? 0;
      for (const { media } of medias) {
        if (media.kind === 'image') {
          duration += COVER_MAX_MEDIA_DURATION;
        } else if (media.kind === 'video') {
          const path = resources.find(r => r.id === media.uri)?.path;
          if (!path) {
            continue;
          }
          const itemDuration = Math.min(
            media.duration,
            COVER_MAX_MEDIA_DURATION,
          );
          const { resolution, videoScale } = reduceVideoResolutionIfNecessary(
            media.width,
            media.height,
            media.rotation,
            MAX_DISPLAY_DECODER_RESOLUTION,
          );
          videoScales[media.uri] = videoScale;
          items.push({
            id: media.uri,
            path,
            startTime: 0,
            compositionStartTime: Math.max(0, duration - transitionDuration),
            duration: itemDuration,
            resolution,
          });
          duration = Math.max(0, duration - transitionDuration);
          duration += itemDuration;
        }
      }
      return {
        images,
        composition: {
          duration,
          items,
        },
        videoScales,
      };
    };

    unstable_batchedUpdates(() => {
      setComposition(null);
      setImages({});
      setVideoScales({});
    });
    if (medias.length) {
      setLoadingResources(true);
      fetchResources().then(
        result => {
          if (canceled || !result) {
            if (result?.images) {
              Object.keys(result.images).forEach(SKImageLoader.unrefImage);
            }
            return;
          }
          const { images, composition, videoScales } = result;
          unstable_batchedUpdates(() => {
            setImages(images);
            setComposition(composition ?? null);
            setLoadingResources(false);
            setVideoScales(videoScales ?? {});
          });
          onLoadInner();
        },
        error => {
          if (canceled) {
            return;
          }
          onErrorInner(error);
          setLoadingResources(false);
        },
      );
    }
    return () => {
      canceled = true;
      abortController.abort();
    };
  }, [cover.coverTransition, isDynamic, medias, onErrorInner, onLoadInner]);

  useEffect(
    () => () => {
      Object.keys(images).forEach(SKImageLoader.unrefImage);
    },
    [images],
  );

  const drawFrame = useCallback<FrameDrawer>(
    infos => {
      'worklet';
      if (!lutShaders) {
        return;
      }
      coverDrawer({
        ...infos,
        cover,
        images,
        lutShaders,
        videoScales,
      });
    },
    [lutShaders, cover, images, videoScales],
  );

  const loading = loadingResources || !lutShaders;

  return (
    <View
      style={[
        style,
        {
          backgroundColor: colors.grey200,
          borderRadius: COVER_CARD_RADIUS * width,
          width,
          height,
          overflow: 'hidden',
        },
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator />
      ) : isDynamic ? (
        <VideoCompositionRenderer
          composition={composition}
          width={width}
          height={height}
          drawFrame={drawFrame}
        />
      ) : (
        <View style={{ width, height }} />
      )}
    </View>
  );
};

export default CoverPreview;
