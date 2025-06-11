import {
  useRef,
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useIntl } from 'react-intl';
import { Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Camera,
  useCameraDevice,
  useCameraDevices,
  useCameraFormat,
} from 'react-native-vision-camera';
import { colors } from '#theme';
import useIsForeground from '#hooks/useIsForeground';
import FloatingIconButton from '#ui/FloatingIconButton';
import type { ForwardedRef } from 'react';
import type { LayoutRectangle, ViewProps } from 'react-native';
import type { CameraRuntimeError } from 'react-native-vision-camera';

export type CameraViewProps = ViewProps & {
  /**
   * A callback that is called when the camera is ready to take photos/videos
   */
  onInitialized(): void;
  /**
   * A callback that is called when the camera encounters an error
   */
  onError(error: CameraRuntimeError): void;

  /* define the initial camera position. */
  initialCameraPosition?: 'back' | 'front';

  /**
   * Enables **photo capture** with the `takePhoto` function (see ["Taking Photos"](https://mrousavy.github.io/react-native-vision-camera/docs/guides/capturing#taking-photos))
   */
  photo?: boolean;
  /**
   * Enables **video capture** with the `startRecording` function (see ["Recording Videos"](https://mrousavy.github.io/react-native-vision-camera/docs/guides/capturing/#recording-videos))
   *
   * Note: If you want to use `video` and `frameProcessor` simultaneously, make sure [`supportsParallelVideoProcessing`](https://mrousavy.github.io/react-native-vision-camera/docs/guides/devices#the-supportsparallelvideoprocessing-prop) is `true`.
   */
  video?: boolean;

  cameraButtonsLeftRightPosition?: number;
};

/**
 * An object that represents a recording session
 */
export type RecordSession = Promise<{
  /**
   * The path to the recorded video
   */
  uri: string;
  /**
   * The duration of the recorded video in seconds
   */
  duration: number;
}>;

/**
 * The type of the reference to the CameraView component
 */
export type CameraViewHandle = {
  /**
   * Takes a photo and returns the path to the photo
   */
  takePhoto(): Promise<string | null>;
  /**
   * Starts recording a video and returns a RecordSession
   */
  startRecording(): RecordSession | null;

  stopRecording(): void;
};

/**
 * Camera view component, allows to take photos and record videos
 */
const CameraView = (
  {
    onInitialized,
    onError,
    initialCameraPosition = 'back',
    photo,
    video,
    cameraButtonsLeftRightPosition,
    ...props
  }: CameraViewProps,
  ref: ForwardedRef<CameraViewHandle>,
) => {
  // #region camera state
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();

  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>(
    devices.length ? initialCameraPosition : 'back',
  );

  const supportsCameraFlipping = devices.length > 1;

  const [layoutRect, setLayoutRect] = useState<LayoutRectangle | null>(null);

  const device = useCameraDevice(cameraPosition);

  const [flash, setFlash] = useState<'auto' | 'off' | 'on'>('off');
  const supportsFlash = device?.hasFlash ?? false;

  const isActive = useIsForeground();

  const hasMicrophonePermission = useMemo(() => {
    const status = Camera.getMicrophonePermissionStatus();
    return status === 'granted';
  }, []);

  // #endregion

  // #region Camera ref
  useImperativeHandle(
    ref,
    () => ({
      async takePhoto() {
        if (!camera.current || !isActive) {
          return null;
        }
        const photo = await camera.current.takePhoto({
          flash: supportsFlash ? flash : 'off',
          enableShutterSound: false,
          // TODO investigate those parameters
          // enableAutoDistortionCorrection: true,
          // enableAutoRedEyeReduction: true,
          // enableAutoStabilization: true,
        });

        return photo.path;
      },

      startRecording() {
        if (!camera.current || !isActive) {
          return null;
        }

        return new Promise((resolve, reject) => {
          camera.current?.startRecording({
            flash: flash === 'auto' ? 'off' : flash,
            onRecordingError(error) {
              reject(error);
            },
            onRecordingFinished(video) {
              resolve({
                uri: video.path,
                duration: video.duration,
              });
            },
          });
        });
      },
      stopRecording() {
        if (!camera.current || !isActive) {
          return null;
        }
        camera.current.stopRecording();
      },
    }),
    [flash, isActive, supportsFlash],
  );
  // #endregion

  // #region camera controls
  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition(p => (p === 'back' ? 'front' : 'back'));
  }, []);

  const onFlashPressed = useCallback(() => {
    setFlash(f => (f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off'));
  }, []);
  // #endregion

  // #region focus
  const focusRingVisible = useSharedValue(0);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(
    null,
  );

  const resetFocus = useCallback(() => {
    setFocusPoint(null);
  }, []);

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
    [device?.supportsFocus, focusRingVisible, resetFocus],
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
  // #endregion

  const intl = useIntl();

  const aspectRatio = layoutRect
    ? layoutRect.width / layoutRect.height
    : undefined;

  // see https://github.com/mrousavy/react-native-vision-camera/issues/2208#issuecomment-1850856762
  const format = useCameraFormat(device, [
    {
      photoAspectRatio: aspectRatio,
      videoAspectRatio: aspectRatio,
    },
  ]);

  return (
    <View
      {...props}
      onLayout={event => setLayoutRect(event.nativeEvent.layout)}
    >
      {device !== undefined ? (
        <GestureDetector gesture={gesture}>
          <Camera
            ref={camera}
            style={{ flex: 1 }}
            device={device}
            format={Platform.OS === 'android' ? format : undefined}
            isActive={isActive}
            onInitialized={onInitialized}
            onError={onError}
            enableZoomGesture
            photo={photo}
            video={video}
            audio={hasMicrophonePermission}
            outputOrientation="preview"
            exposure={0}
            videoBitRate="low"
            photoQualityBalance={
              Platform.OS === 'android' ? 'speed' : 'balanced'
            }
            isMirrored={false}
          />
        </GestureDetector>
      ) : null}

      <Animated.View
        style={[
          styles.focusRing,
          {
            top: (focusPoint?.y ?? 0) - FOCUS_RING_SIZE / 2,
            left: (focusPoint?.x ?? 0) - FOCUS_RING_SIZE / 2,
          },
          focusRingStyle,
        ]}
      />
      {supportsFlash && (
        <FloatingIconButton
          icon={
            flash === 'off'
              ? 'flash_off'
              : flash === 'auto'
                ? 'flash_auto'
                : 'flash_on'
          }
          style={[
            styles.flashButton,
            { left: cameraButtonsLeftRightPosition ?? 25 },
          ]}
          size={40}
          onPress={onFlashPressed}
          accessibilityRole="togglebutton"
          accessibilityValue={{
            text:
              flash === 'off'
                ? intl.formatMessage({
                    defaultMessage: 'Off',
                    description: 'flash off accessibility value',
                  })
                : flash === 'auto'
                  ? intl.formatMessage({
                      defaultMessage: 'Auto',
                      description: 'flash auto accessibility value',
                    })
                  : intl.formatMessage({
                      defaultMessage: 'On',
                      description: 'flash on accessibility value',
                    }),
          }}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Torch',
            description: 'camera torch button accessibility label',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Tap to activate torch',
            description: 'camera torch button accessibility hint',
          })}
        />
      )}

      {supportsCameraFlipping && (
        <FloatingIconButton
          icon="revert"
          style={[
            styles.flipButton,
            { right: cameraButtonsLeftRightPosition ?? 25 },
          ]}
          size={40}
          onPress={onFlipCameraPressed}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Flip camera',
            description: 'camera flip button accessibility label',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Tap to switch between front and back camera',
            description: 'camera flip button accessibility hint',
          })}
        />
      )}
    </View>
  );
};

export default forwardRef(CameraView);

const FOCUS_RING_SIZE = 100;

const styles = StyleSheet.create({
  focusRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: FOCUS_RING_SIZE / 2,
    width: FOCUS_RING_SIZE,
    height: FOCUS_RING_SIZE,
  },
  flashButton: {
    position: 'absolute',
    bottom: 20,
  },
  flipButton: {
    position: 'absolute',
    bottom: 20,
  },
});
