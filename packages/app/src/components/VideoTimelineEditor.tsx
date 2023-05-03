import range from 'lodash/range';
import { useCallback } from 'react';
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
import Text from '#ui/Text';
import { GPUImageView, VideoFrame } from './gpu';
import type { EditionParameters } from './gpu';
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
   * edition parameters
   *
   * @type {EditionParameters}
   */
  editionParameters: EditionParameters;
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
  editionParameters,
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

  const dispatchChange = useCallback(() => {
    onChange({
      startTime: leftPosition.value / secondPixel,
      duration: (rightPosition.value - leftPosition.value) / secondPixel,
    });
  }, [leftPosition.value, onChange, rightPosition.value, secondPixel]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: leftPosition.value,
      right: sliderWidth - rightPosition.value,
      height: imagesHeight + 4,
    };
  }, [leftPosition.value, rightPosition.value]);

  const eventHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; endX: number; left: boolean; right: boolean }
  >(
    {
      onStart: (event, ctx) => {
        ctx.startX = leftPosition.value;
        ctx.endX = rightPosition.value;
        if (event.x < 6) {
          ctx.left = true;
        } else if (event.x > rightPosition.value - leftPosition.value - 6) {
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
            } else if (ctx.endX - leftPos > maxDuration * minDurationPixel) {
              rightPosition.value = leftPos + maxDuration * minDurationPixel;
            }
          }
        } else if (ctx.right) {
          const rightPos = Math.min(sliderWidth, ctx.endX + event.translationX);
          if (rightPos >= minDurationPixel) {
            rightPosition.value = rightPos;
            if (rightPos - ctx.startX <= minDurationPixel) {
              leftPosition.value = rightPos - secondPixel;
            } else if (rightPos - ctx.startX > maxDuration * minDurationPixel) {
              leftPosition.value = rightPos - maxDuration * minDurationPixel;
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
        runOnJS(dispatchChange)();
      },
    },
    [leftPosition.value, rightPosition.value],
  );

  const formatDurationMarker = (index: number) => {
    const duration =
      (video.duration / (NUMBER_MAX_TICK - 1)) *
      (index / (NUMBER_INTERCALAR_TICK + 1));
    return formatDuration(duration);
  };

  const styles = useStyleSheet(computedStyle);

  return (
    <View {...props}>
      <View style={styles.root}>
        {range(0, video.duration, video.duration / nbImage).map(second => (
          <GPUImageView
            key={second}
            style={{ height: imagesHeight, width: itemWidth }}
          >
            <VideoFrame
              uri={video.uri}
              parameters={editionParameters}
              time={second}
            />
          </GPUImageView>
        ))}
      </View>
      <PanGestureHandler onGestureEvent={eventHandler}>
        <Animated.View style={[styles.timeRange, animatedStyle]}>
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
                  style={[
                    index % (NUMBER_INTERCALAR_TICK + 1) === 0
                      ? styles.stepmarker
                      : styles.smallMarker,
                  ]}
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

const computedStyle = createStyleSheet(appearance => ({
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
    width: 6,
    top: -4,
    bottom: -4,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
    borderRadius: 3,
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
}));

const NUMBER_MAX_TICK = 4;
const NUMBER_INTERCALAR_TICK = 4;
