import { createDeffered } from '@azzapp/shared/lib/asyncHelpers';
import {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useCameraDevices, Camera } from 'react-native-vision-camera';
import useIsForeground from '../../hooks/useIsForeground';
import FloatingIconButton from '../../ui/FloatingIconButton';
import type { ForwardedRef } from 'react';
import type { ViewProps } from 'react-native';
import type { CameraRuntimeError } from 'react-native-vision-camera';

type CameraViewProps = ViewProps & {
  onInitialized(): void;
  onError(error: CameraRuntimeError): void;
};

export type RecordSession = {
  end(): Promise<{ path: string; duration: number }>;
  cancel(): void;
};

export type CameraViewHandle = {
  takePhoto(): Promise<string | null>;
  startRecording(): RecordSession | null;
};

const CameraView = (
  { onInitialized, onError, ...props }: CameraViewProps,
  ref: ForwardedRef<CameraViewHandle>,
) => {
  const camera = useRef<Camera>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState(false);

  const isActive = useIsForeground();

  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>(
    'back',
  );
  const [flash, setFlash] = useState<'auto' | 'off' | 'on'>('off');

  useImperativeHandle(
    ref,
    () => ({
      async takePhoto() {
        if (!camera.current) {
          return null;
        }
        const photo = await camera.current.takePhoto({
          flash,
          // TODO investigate those parameters
          // enableAutoDistortionCorrection: true,
          // enableAutoRedEyeReduction: true,
          // enableAutoStabilization: true,
          skipMetadata: true,
        });
        return photo.path;
      },

      startRecording() {
        if (!camera.current) {
          return null;
        }
        const resultDeffered = createDeffered<{
          path: string;
          duration: number;
        }>();
        let isActive = true;
        camera.current.startRecording({
          flash,
          onRecordingError(error) {
            resultDeffered.reject(error);
          },
          onRecordingFinished(video) {
            resultDeffered.resolve(video);
          },
        });
        return {
          end() {
            if (!isActive || !camera.current) {
              throw new Error('Invalid record session');
            }
            isActive = false;
            return camera.current
              .stopRecording()
              .then(() => resultDeffered.promise);
          },
          cancel() {
            if (isActive) {
              void camera.current?.stopRecording();
            }
          },
        };
      },
    }),
    [flash],
  );

  const devices = useCameraDevices();
  const device = devices[cameraPosition];

  const supportsCameraFlipping = useMemo(
    () => devices.back != null && devices.front != null,
    [devices.back, devices.front],
  );
  const supportsFlash = device?.hasFlash ?? false;

  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition(p => (p === 'back' ? 'front' : 'back'));
  }, []);

  const onFlashPressed = useCallback(() => {
    setFlash(f => (f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off'));
  }, []);

  const focusRingVisible = useSharedValue(0);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(
    null,
  );

  const resetFocus = () => {
    setFocusPoint(null);
  };

  const setFocus = useCallback(
    (x: number, y: number) => {
      if (!device?.supportsFocus) {
        return;
      }
      const point = { x, y };
      camera.current?.focus(point).then(
        () => {
          setFocusPoint({ x: point.x, y: point.y });
          focusRingVisible.value = 1;
          focusRingVisible.value = withTiming(0, { duration: 500 }, () =>
            runOnJS(resetFocus)(),
          );
        },
        () => {
          setFocusPoint(null);
        },
      );
    },
    [device?.supportsFocus, focusRingVisible],
  );

  const gesture = useMemo(
    () =>
      Gesture.Tap().onEnd(event => {
        runOnJS(setFocus)(event.x, event.y);
      }),
    [setFocus],
  );

  const focusRingStyle = useAnimatedStyle(() => {
    const scale = focusRingVisible.value / 2 + 0.5;
    return {
      opacity: focusRingVisible.value,
      transform: [{ scale }],
    };
  });

  useEffect(() => {
    Camera.getMicrophonePermissionStatus().then(
      status => setHasMicrophonePermission(status === 'authorized'),
      () => setHasMicrophonePermission(false),
    );
  }, []);

  return (
    <View {...props}>
      {device != null && (
        <GestureDetector gesture={gesture}>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            preset="high"
            fps={30}
            isActive={isActive}
            onInitialized={onInitialized}
            onError={onError}
            enableZoomGesture={true}
            photo={true}
            video={true}
            audio={hasMicrophonePermission}
            orientation="portrait"
          />
        </GestureDetector>
      )}
      <Animated.View
        style={[
          styles.focusRing,
          {
            top: (focusPoint?.y ?? 0) - FOCUS_RING_SIZE / 2 ?? 0,
            left: (focusPoint?.x ?? 0) - FOCUS_RING_SIZE / 2,
          },
          focusRingStyle,
        ]}
      />
      {supportsFlash && (
        <FloatingIconButton
          icon={
            flash === 'off'
              ? 'flash-disabled'
              : flash === 'auto'
              ? 'flash-auto'
              : 'flash'
          }
          style={styles.flashButton}
          variant="white"
          size={40}
          onPress={onFlashPressed}
        />
      )}
      {supportsCameraFlipping && (
        <FloatingIconButton
          icon="invert"
          style={styles.flipButton}
          variant="white"
          size={40}
          onPress={onFlipCameraPressed}
        />
      )}
    </View>
  );
};

export default forwardRef(CameraView);

const FOCUS_RING_SIZE = 100;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  focusRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: FOCUS_RING_SIZE / 2,
    width: FOCUS_RING_SIZE,
    height: FOCUS_RING_SIZE,
  },
  flashButton: {
    position: 'absolute',
    left: 25,
    bottom: 20,
  },
  flipButton: {
    position: 'absolute',
    right: 25,
    bottom: 20,
  },
});
