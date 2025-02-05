import { Canvas } from '@shopify/react-native-skia';
import range from 'lodash/range';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { formatDuration } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { NativeTextureLoader } from '#helpers/mediaEditions';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import TextureImage from '#ui/TextureImage';
import type { TextureInfo } from '#helpers/mediaEditions/NativeTextureLoader';
import type { ViewProps } from 'react-native';
import type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

/**
 * A time range
 */
type TimeRange = {
  /**
   * The start time of the time range in seconds
   */
  startTime: number;
  /**
   * The duration of the time range in seconds
   */
  duration: number;
};

type VideoTimelineEditorProps = ViewProps & {
  /**
   * the video to edit
   *
   * @type {{ uri: string; duration: number }}
   */
  video: { uri: string; duration: number };
  /**
   * aspect ratio of the video to edit
   *
   * @type {number}
   */
  aspectRatio: number;
  /**
   * maxDuration for the edited video
   *
   * @type {number}
   */
  maxDuration: number;
  /**
   * minDuration for the edited video
   *
   * @type {number} @default 1
   */
  minDuration?: number;
  /**
   * width of the component
   *
   * @type {number}
   */
  width: number;
  /**
   * height of image preview in timeline editor
   *
   * @type {number}
   */
  imagesHeight: number;
  /**
   *
   *
   * @type {(TimeRange | null)}
   */
  timeRange?: TimeRange | null;
  /**
   *
   *
   */
  onChange: (timeRange: TimeRange) => void;
};

const VideoTimelineEditor = ({
  video,
  aspectRatio,
  maxDuration,
  width,
  imagesHeight,
  minDuration = 1,
  timeRange,
  onChange,
  ...props
}: VideoTimelineEditorProps) => {
  const itemWidth = imagesHeight * aspectRatio;
  const nbImage = Math.floor(width / itemWidth);
  const sliderWidth = nbImage * itemWidth;
  const { duration: mediaDuration } = video;

  const secondPixel = sliderWidth / mediaDuration;
  const minDurationPixel = minDuration * secondPixel;
  const leftPosition = useSharedValue(
    (timeRange?.startTime ?? 0) * secondPixel,
  );
  const rightPosition = useSharedValue(
    (Math.min(timeRange?.duration ?? mediaDuration, maxDuration) +
      (timeRange?.startTime ?? 0)) *
      secondPixel,
  );

  const dispatchChange = useCallback(
    (left: number, right: number) => {
      onChange({
        startTime: left / secondPixel,
        duration: (right - left) / secondPixel,
      });
    },
    [onChange, secondPixel],
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: leftPosition.value,
      right: sliderWidth - rightPosition.value,
      height: imagesHeight + 4,
    };
  });

  const eventHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; endX: number; left: boolean; right: boolean }
  >(
    {
      onStart: (event, ctx) => {
        ctx.startX = leftPosition.value;
        ctx.endX = rightPosition.value;

        if (minDuration === maxDuration) {
          return;
        }

        if (event.x < THUMB_WIDTH * 2) {
          ctx.left = true;
        } else if (
          event.x >
          rightPosition.value - leftPosition.value - THUMB_WIDTH * 2
        ) {
          ctx.right = true;
        }
      },
      onActive: (event, ctx) => {
        if (ctx.left) {
          const leftPos = Math.max(0, ctx.startX + event.translationX);
          if (leftPos <= sliderWidth - minDurationPixel) {
            leftPosition.value = leftPos;
            if (ctx.endX - leftPos <= minDurationPixel) {
              rightPosition.value = leftPos + minDurationPixel;
            } else if (ctx.endX - leftPos > maxDuration * secondPixel) {
              rightPosition.value = leftPos + maxDuration * secondPixel;
            }
          }
        } else if (ctx.right) {
          const rightPos = Math.min(sliderWidth, ctx.endX + event.translationX);
          if (rightPos >= minDurationPixel) {
            rightPosition.value = rightPos;
            if (rightPos - ctx.startX <= minDurationPixel) {
              leftPosition.value = rightPos - minDurationPixel;
            } else if (rightPos - ctx.startX > maxDuration * secondPixel) {
              leftPosition.value = rightPos - maxDuration * secondPixel;
            }
          }
        } else if (
          ctx.startX + event.translationX >= 0 &&
          ctx.endX + event.translationX <= sliderWidth
        ) {
          leftPosition.value = ctx.startX + event.translationX;
          rightPosition.value = ctx.endX + event.translationX;
        } else if (ctx.startX + event.translationX <= 0) {
          leftPosition.value = 0;
          rightPosition.value = ctx.endX - ctx.startX;
        } else if (ctx.endX + event.translationX >= sliderWidth) {
          leftPosition.value = ctx.startX - (ctx.endX - sliderWidth);
          rightPosition.value = sliderWidth;
        }
      },
      onEnd: (_, ctx) => {
        ctx.left = false;
        ctx.right = false;
      },
      onFinish: () => {
        runOnJS(dispatchChange)(leftPosition.value, rightPosition.value);
      },
    },
    [leftPosition, rightPosition],
  );

  const [texturesInfos, setTexturesInfos] = useState<TextureInfo[]>([]);
  useEffect(() => {
    let canceled = false;
    let keys: string[] = [];
    const thumbnails = range(0, video.duration, video.duration / nbImage).map(
      second =>
        NativeTextureLoader.loadVideoThumbnail(video.uri, second, {
          width: 256,
          height: 256,
        }),
    );
    Promise.all(thumbnails.map(video => video.promise))
      .then(setTexturesInfos)
      .then(
        () => {
          if (canceled) {
            return;
          }
          keys = thumbnails.map(video => video.key);
          keys.forEach(NativeTextureLoader.ref);
        },
        () => {
          console.warn('error loading images');
        },
      );
    return () => {
      canceled = true;
      keys.forEach(NativeTextureLoader.unref);
    };
  }, [video.uri, video.duration, nbImage]);

  const formatDurationMarker = (index: number) => {
    const duration =
      (video.duration / (NUMBER_MAX_TICK - 1)) *
      (index / (NUMBER_INTERCALAR_TICK + 1));
    return formatDuration(duration);
  };

  const styles = useStyleSheet(styleSheet);

  return (
    <View {...props}>
      <View style={styles.root}>
        <Canvas style={{ height: imagesHeight, width: sliderWidth }}>
          {texturesInfos.map((textureInfo, index) => (
            <TextureImage
              fit="cover"
              key={index}
              textureInfo={textureInfo}
              y={0}
              x={index * itemWidth}
              width={itemWidth}
              height={imagesHeight}
            />
          ))}
        </Canvas>
      </View>
      <PanGestureHandler onGestureEvent={eventHandler}>
        <Animated.View
          style={[styles.timeRange, animatedStyle]}
          hitSlop={{ left: 35, right: 35 }}
        >
          {minDuration === maxDuration && (
            <View style={styles.moveSegment}>
              <Icon icon="move_segment" />
            </View>
          )}
          <View style={[styles.thumb, styles.thumbStart]} />
          <View style={[styles.thumb, styles.thumbEnd]} />
        </Animated.View>
      </PanGestureHandler>
      <View style={styles.viewTimeMarker}>
        {Array.from({ length: NUMBER_INTERCALAR_TICK * NUMBER_MAX_TICK }).map(
          (_, index) => {
            return (
              <View key={`timeraouge_${index}`} style={{ height: 25 }}>
                <View
                  style={
                    index % (NUMBER_INTERCALAR_TICK + 1) === 0
                      ? styles.stepmarker
                      : styles.smallMarker
                  }
                />
                {(index % (NUMBER_INTERCALAR_TICK + 1) === 0 ||
                  index === NUMBER_INTERCALAR_TICK * NUMBER_MAX_TICK - 1) && (
                  <Text variant="small" style={styles.textMarker}>
                    {formatDurationMarker(index)}
                  </Text>
                )}
              </View>
            );
          },
        )}
      </View>
    </View>
  );
};

export default VideoTimelineEditor;

const THUMB_WIDTH = 6;

const styleSheet = createStyleSheet(appearance => ({
  viewTimeMarker: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeRange: {
    position: 'absolute',
    borderColor: appearance === 'light' ? colors.black : colors.white,
    top: -2,
    borderWidth: 1,
  },
  textMarker: {
    position: 'absolute',
    width: 32,
    left: -15,
    flexWrap: 'nowrap',
    bottom: 0,
    color: colors.grey300,
  },
  smallMarker: {
    height: 2,
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.grey200,
    overflow: 'visible',
  },
  stepmarker: {
    height: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.grey200,
    overflow: 'visible',
  },
  root: {
    flexDirection: 'row',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_WIDTH,
    top: -4,
    bottom: -4,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
    borderRadius: THUMB_WIDTH / 2,
  },
  thumbStart: {
    left: -4,
  },
  thumbEnd: {
    right: -4,
  },
  line: {
    position: 'absolute',
    height: 1,
    backgroundColor: colors.black,
  },
  moveSegment: {
    position: 'absolute',
    top: -25,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
}));

const NUMBER_MAX_TICK = 4;
const NUMBER_INTERCALAR_TICK = 4;
