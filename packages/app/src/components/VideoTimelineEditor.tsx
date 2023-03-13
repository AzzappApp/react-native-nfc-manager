import range from 'lodash/range';
import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '#theme';
import { EditableImage } from './medias';
import type { ImageEditionParameters, TimeRange } from '#helpers/mediaHelpers';
import type { ViewProps } from 'react-native';

type VideoTimelineEditorProps = ViewProps & {
  video: { uri: string; duration: number };
  aspectRatio: number;
  editionParameters: ImageEditionParameters;
  maxDuration: number;
  width: number;
  imagesHeight: number;
  timeRange?: TimeRange | null;
  onChange: (timeRange: TimeRange) => void;
};

// TODO docs and tests once this component is production ready
const VideoTimelineEditor = ({
  video,
  aspectRatio,
  editionParameters,
  maxDuration,
  width,
  imagesHeight,
  timeRange,
  onChange,
  ...props
}: VideoTimelineEditorProps) => {
  const itemWidth = imagesHeight * aspectRatio;
  const nbImage = Math.floor(width / itemWidth);
  const sliderWidth = nbImage * itemWidth;
  const { duration: mediaDuration } = video;

  const startTimeSharedValue = useSharedValue(timeRange?.startTime ?? 0);
  const durationSharedValue = useSharedValue(
    Math.min(timeRange?.duration ?? mediaDuration, maxDuration),
  );

  const startTimeOffset = useSharedValue(0);
  const durationOffset = useSharedValue(0);

  const dispatchChange = useCallback(() => {
    onChange({
      startTime: startTimeSharedValue.value,
      duration: durationSharedValue.value,
    });
  }, [durationSharedValue.value, onChange, startTimeSharedValue.value]);

  const startThumbGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          'worklet';
          startTimeOffset.value = startTimeSharedValue.value;
          durationOffset.value = durationSharedValue.value;
        })
        .onUpdate(e => {
          'worklet';
          const offset = (e.translationX * mediaDuration) / sliderWidth;
          startTimeSharedValue.value = clamp(
            startTimeOffset.value + offset,
            0,
            Math.max(mediaDuration - 1, 0),
          );
          durationSharedValue.value = clamp(
            durationOffset.value - offset,
            Math.min(mediaDuration, 1),
            Math.min(mediaDuration, maxDuration),
          );
        })
        .onFinalize(() => {
          'worklet';
          runOnJS(dispatchChange)();
        }),
    [
      startTimeOffset,
      startTimeSharedValue,
      durationOffset,
      durationSharedValue,
      mediaDuration,
      sliderWidth,
      maxDuration,
      dispatchChange,
    ],
  );

  const endThumbGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          'worklet';
          durationOffset.value = durationSharedValue.value;
        })
        .onUpdate(e => {
          'worklet';
          durationSharedValue.value = clamp(
            durationOffset.value +
              (e.translationX * mediaDuration) / sliderWidth,
            Math.min(mediaDuration, 1),
            Math.min(mediaDuration - startTimeSharedValue.value, maxDuration),
          );
        })
        .onFinalize(() => {
          'worklet';
          runOnJS(dispatchChange)();
        }),
    [
      dispatchChange,
      durationOffset,
      durationSharedValue,
      maxDuration,
      mediaDuration,
      sliderWidth,
      startTimeSharedValue.value,
    ],
  );

  const startPosition = useDerivedValue(
    () => (startTimeSharedValue.value * sliderWidth) / mediaDuration,
  );
  const endPosition = useDerivedValue(
    () =>
      ((startTimeSharedValue.value + durationSharedValue.value) * sliderWidth) /
      mediaDuration,
  );

  const startThumbAnimatedStyle = useAnimatedStyle(() => ({
    left: startPosition.value - 10,
  }));

  const endThumbAnimatedStyle = useAnimatedStyle(() => ({
    left: endPosition.value - 10,
  }));

  const lineStyle = useAnimatedStyle(() => ({
    left: startPosition.value + 5,
    width: endPosition.value - startPosition.value - 10,
  }));

  return (
    <View {...props}>
      <View style={styles.root}>
        {range(0, video.duration, video.duration / nbImage).map(second => (
          <EditableImage
            key={second}
            source={{ uri: video.uri, kind: 'video', videoTime: second }}
            editionParameters={editionParameters}
            style={{ height: imagesHeight, width: itemWidth }}
          />
        ))}
        <GestureDetector gesture={startThumbGesture}>
          <Animated.View
            style={[styles.thumbContainer, startThumbAnimatedStyle]}
          >
            <View style={styles.thumb} />
          </Animated.View>
        </GestureDetector>
        <GestureDetector gesture={endThumbGesture}>
          <Animated.View style={[styles.thumbContainer, endThumbAnimatedStyle]}>
            <View style={styles.thumb} />
          </Animated.View>
        </GestureDetector>
        <Animated.View style={[styles.line, { top: -2 }, lineStyle]} />
        <Animated.View style={[styles.line, { bottom: -2 }, lineStyle]} />
      </View>
    </View>
  );
};

export default VideoTimelineEditor;

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
  },
  thumbContainer: {
    position: 'absolute',
    width: 20,
    top: -4,
    bottom: -4,
    alignItems: 'center',
  },
  thumb: {
    position: 'absolute',
    width: 6,
    height: '100%',
    backgroundColor: colors.black,
    borderRadius: 3,
  },
  line: {
    position: 'absolute',
    height: 1,
    backgroundColor: colors.black,
  },
});

// can't use lodash clamp in worklet
const clamp = (num: number, min: number, max: number) => {
  'worklet';
  return num >= max ? max : num <= min ? min : num;
};
