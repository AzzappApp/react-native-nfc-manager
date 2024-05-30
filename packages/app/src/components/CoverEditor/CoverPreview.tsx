import { useCallback, useMemo } from 'react';
import { Dimensions, PixelRatio, View } from 'react-native';
import {
  COVER_CARD_RADIUS,
  COVER_MAX_MEDIA_DURATION,
} from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import VideoCompositionRenderer from '#components/VideoCompositionRenderer';
import { reduceVideoResolutionIfNecessary } from '#helpers/mediaEditions';
import ActivityIndicator from '#ui/ActivityIndicator';
import coverDrawer from './drawing/coverDrawer';
import coverTransitions from './drawing/coverTransitions';
import type { CoverEditorState } from './coverEditorTypes';
import type {
  FrameDrawer,
  VideoCompositionItem,
} from '@azzapp/react-native-skia-video';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type CoverPreviewProps = Exclude<ViewProps, 'children'> & {
  coverEditorState: CoverEditorState;
  width: number;
  height: number;
};

const MAX_DISPLAY_DECODER_RESOLUTION = Math.min(
  (Dimensions.get('window').height / 2) * PixelRatio.get(),
  1920,
);

const CoverPreview = ({
  coverEditorState,
  width,
  height,
  style,
  ...props
}: CoverPreviewProps) => {
  const {
    coverTransition,
    medias,
    overlayLayer,
    images,
    videoPaths,
    lutShaders,
    loadingLocalMedia,
    loadingRemoteMedia,
  } = coverEditorState;
  const isDynamic =
    medias.some(({ media }) => media.kind === 'video') || medias.length > 1;

  const { composition, videoScales } = useMemo(() => {
    const allItemsLoaded =
      medias.every(
        ({ media }) =>
          (media.kind === 'image' && images[media.uri]) ||
          (media.kind === 'video' && videoPaths[media.uri]),
      ) &&
      (!overlayLayer || images[overlayLayer.uri]);
    if (loadingLocalMedia || loadingRemoteMedia || !allItemsLoaded) {
      return { composition: null, videoScales: {} };
    }
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
          MAX_DISPLAY_DECODER_RESOLUTION,
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

    return {
      composition: {
        duration,
        items,
      },
      videoScales,
    };
  }, [
    coverTransition,
    images,
    loadingLocalMedia,
    loadingRemoteMedia,
    medias,
    overlayLayer,
    videoPaths,
  ]);

  const drawFrame = useCallback<FrameDrawer>(
    infos => {
      'worklet';
      if (!lutShaders) {
        return;
      }
      coverDrawer({
        ...infos,
        cover: coverEditorState,
        images,
        lutShaders,
        videoScales,
      });
    },
    [lutShaders, coverEditorState, images, videoScales],
  );

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
      {loadingRemoteMedia ? (
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
