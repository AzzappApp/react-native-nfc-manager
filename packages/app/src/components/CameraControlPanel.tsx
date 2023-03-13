import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, textStyles } from '#theme';
import { formatVideoTime } from '#helpers/mediaHelpers';
import useInterval from '#hooks/useInterval';
import PressableBackground from '#ui/PressableBackground';
import ProgressBar from '#ui/ProgressBar';
import ViewTransition from '#ui/ViewTransition';
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
  const recordingTimeout = useRef<any>();

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
        style={{ opacity: isRecording ? 1 : 0, alignSelf: 'stretch' }}
      />
      {timer != null && (
        <Text style={textStyles.normal}>
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
            <ViewTransition
              transitionDuration={120}
              transitions={[
                'transform',
                'borderRadius',
                'backgroundColor',
                'width',
                'height',
              ]}
              style={
                !isRecording
                  ? [
                      styles.videoButton,
                      pressed && styles.videoButtonPressed,
                      !ready && styles.photoButtonDisabled,
                    ]
                  : [
                      styles.stopButton,
                      pressed && styles.stopButtonPressed,
                      !ready && styles.photoButtonDisabled,
                    ]
              }
            />
          )}
        </Pressable>
      )}
    </View>
  );
};

export default CameraControlPanel;

const CAPTURE_BUTTON_SIZE = 80;

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: '#FFF',
  },
  photoButtonDisabled: {
    opacity: 0.5,
  },
  videoButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.red400,
    transform: [{ scale: 1 }],
  },
  videoButtonPressed: {
    transform: [{ scale: 1.1 }],
  },
  videoButtonDisabled: {
    opacity: 0.5,
  },
  stopButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.black,
    transform: [{ scale: 1 }],
  },
  stopButtonPressed: {
    transform: [{ scale: 1.1 }],
  },
});
