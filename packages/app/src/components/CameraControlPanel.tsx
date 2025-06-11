import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { colors } from '#theme';
import { formatVideoTime } from '#helpers/mediaHelpers';
import useAnimatedState from '#hooks/useAnimatedState';
import useInterval from '#hooks/useInterval';
import PressableBackground from '#ui/PressableBackground';
import ProgressBar from '#ui/ProgressBar';
import Text from '#ui/Text';
import type { ViewProps } from 'react-native';

type CameraControlPanelProps = ViewProps & {
  /**
   * Should be true, when the camera is ready to take photos/videos
   */
  ready: boolean;
  /**
   * The current capture mode
   */
  captureMode: 'photo' | 'video';
  /**
   * The maximum duration of a video in seconds
   */
  maxVideoDuration: number;
  /**
   * A callback that is called when the user press the shutter button
   */
  onTakePhoto(): void;
  /**
   * A callback that is called when the user starts recording a video
   */
  onStartRecording(): void;
  /**
   * A callback that is called when the user stops recording a video
   */
  onStopRecording(): void;
};

/**
 * A component that renders the controls for the camera.
 * It includes a shutter button in photo mode
 * And controls for recording a video in video mode.
 */
const CameraControlPanel = ({
  ready,
  captureMode,
  maxVideoDuration,
  onTakePhoto,
  onStartRecording,
  onStopRecording,
  style,
  ...props
}: CameraControlPanelProps) => {
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(
    null,
  );
  const [timer, setTimer] = useState<number | null>(null);
  const isRecording = recordingStartTime != null;
  const recordingTimeout = useRef<NodeJS.Timeout>(undefined);

  const startRecording = () => {
    onStartRecording();
    setRecordingStartTime(Date.now());
    recordingTimeout.current = setTimeout(
      stopRecording,
      maxVideoDuration * 1000,
    );
  };

  const stopRecording = () => {
    clearTimeout(recordingTimeout.current);
    onStopRecording();
    setRecordingStartTime(null);
    setTimer(null);
  };

  useEffect(() => () => clearTimeout(recordingTimeout.current), []);

  useInterval(
    () => {
      setTimer(Date.now() - recordingStartTime!);
    },
    isRecording ? 10 : 0,
    true,
  );

  const onVideoButtonPress = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const progress = timer != null ? timer / (maxVideoDuration * 1000) : 0;

  const intl = useIntl();

  return (
    <View style={[styles.root, style]} {...props}>
      <ProgressBar
        progress={progress}
        style={{
          opacity: isRecording ? 1 : 0,
          alignSelf: 'stretch',
          position: 'absolute',
          top: 0,
          width: '100%',
        }}
      />
      {timer != null && (
        <Text variant="small" style={{ marginBottom: 25 }}>
          {formatVideoTime(Math.round(timer / 1000))}
        </Text>
      )}
      {captureMode === 'photo' ? (
        <PressableBackground
          style={[styles.photoButton, !ready && styles.photoButtonDisabled]}
          onPress={onTakePhoto}
          disabled={!ready}
          accessibilityState={{ disabled: !ready }}
          highlightColor={colors.grey50}
          accessibilityRole="button"
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Shutter',
            description: 'Accessibility label for the camera shutter button',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Tap to take a photo',
            description: 'Accessibility hint for the camera shutter button',
          })}
        />
      ) : (
        <Pressable
          style={[styles.photoButton, !ready && styles.photoButtonDisabled]}
          onPress={onVideoButtonPress}
          disabled={!ready}
          accessibilityState={{ disabled: !ready }}
          accessibilityRole="button"
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Video Shutter',
            description: 'Accessibility label for the video shutter button',
          })}
          accessibilityHint={
            !isRecording
              ? intl.formatMessage({
                  defaultMessage: 'Tap to start recording',
                  description:
                    'Accessibility label for the camera shutter button',
                })
              : intl.formatMessage({
                  defaultMessage: 'Tap to stop recording',
                  description:
                    'Accessibility label for the camera shutter button',
                })
          }
        >
          {({ pressed }) => (
            <RecordingButton
              isRecording={isRecording}
              pressed={pressed}
              ready={ready}
            />
          )}
        </Pressable>
      )}
    </View>
  );
};
type RecordingButtonProps = {
  isRecording: boolean;
  pressed: boolean;
  ready: boolean;
};
const RecordingButton = ({
  isRecording,
  pressed,
  ready,
}: RecordingButtonProps) => {
  const isRecordingTiming = useAnimatedState(isRecording, { duration: 120 });
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: interpolate(isRecordingTiming.value, [0, 1], [60, 38]),
      height: interpolate(isRecordingTiming.value, [0, 1], [60, 38]),
      borderRadius: interpolate(isRecordingTiming.value, [0, 1], [30, 8]),
      backgroundColor: interpolateColor(
        isRecordingTiming.value,
        [0, 1],
        [colors.red400, colors.black],
      ),
    };
  });

  const pressTiming = useAnimatedState(pressed, { duration: 120 });
  const pressedAnimationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(pressTiming.value, [0, 1], [1, 1.1]) }],
    };
  });

  return (
    <Animated.View
      style={[
        !ready && styles.photoButtonDisabled,
        pressedAnimationStyle,
        animatedStyle,
      ]}
    />
  );
};

export default CameraControlPanel;

const CAPTURE_BUTTON_SIZE = 80;

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  photoButton: {
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    borderWidth: 6,
    borderColor: colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  photoButtonDisabled: {
    opacity: 0.5,
  },
});
