import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, textStyles } from '../../../theme';
import useInterval from '../../hooks/useInterval';
import ProgressBar from '../../ui/ProgressBar';
import ViewTransition from '../../ui/ViewTransition';
import { formatVideoTime } from './helpers';
import type { ViewProps } from 'react-native';

type CameraControlPanelProps = ViewProps & {
  ready: boolean;
  captureMode: 'photo' | 'video';
  maxVideoDuration: number;
  onTakePhoto(): void;
  onStartRecording(): void;
  onStopRecording(): void;
};

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
        <Pressable
          style={({ pressed }) => [
            styles.photoButton,
            pressed && styles.photoButtonPressed,
            !ready && styles.photoButtonDisabled,
          ]}
          onPress={onTakePhoto}
          disabled={!ready}
        />
      ) : (
        <Pressable
          style={[styles.photoButton, !ready && styles.photoButtonDisabled]}
          onPress={onVideoButtonPress}
          disabled={!ready}
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
  },
  photoButtonPressed: {
    backgroundColor: colors.grey50,
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
