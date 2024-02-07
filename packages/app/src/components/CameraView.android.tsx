import {
  useMicrophonePermissions,
  CameraView as ExpoCameraView,
} from 'expo-camera/next';
import {
  useRef,
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import FloatingIconButton from '#ui/FloatingIconButton';
import type { CameraMountError } from 'expo-camera/next';
import type { ForwardedRef } from 'react';

export type CameraViewProps = {
  /**
   * A callback that is called when the camera is ready to take photos/videos
   */
  onInitialized(): void;
  /**
   * A callback that is called when the camera encounters an error
   */
  onError(error: CameraMountError): void;

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
export type RecordSession = {
  /**
   * The path to the recorded video
   */
  uri: string;
};

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
  startRecording(): Promise<RecordSession | null>;

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
  }: CameraViewProps,
  ref: ForwardedRef<CameraViewHandle>,
) => {
  // #region camera state
  const camera = useRef<ExpoCameraView>(null);

  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>(
    initialCameraPosition,
  );

  const [flash, setFlash] = useState<'auto' | 'off' | 'on'>('off');

  const [microPermission, requestPermission] = useMicrophonePermissions();

  useEffect(() => {
    if (video && microPermission?.canAskAgain) {
      requestPermission();
    }
  }, [microPermission?.canAskAgain, requestPermission, video]);
  // #endregion

  // #region Camera ref
  useImperativeHandle(
    ref,
    () => ({
      async takePhoto() {
        if (!camera.current) {
          return null;
        }
        const photo = await camera.current.takePictureAsync({
          quality: 1,
        });
        return photo?.uri ?? null;
      },

      async startRecording() {
        if (!camera.current) {
          return null;
        }

        const result = await camera.current.recordAsync({});

        return result ?? null;
      },
      stopRecording() {
        if (!camera.current) {
          return;
        }

        camera.current.stopRecording();
      },
    }),
    [],
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

  const intl = useIntl();

  return (
    <ExpoCameraView
      ref={camera}
      style={{
        flex: 1,
      }}
      type={cameraPosition}
      onCameraReady={onInitialized}
      onMountError={onError}
      mode={photo ? 'picture' : 'video'}
      flashMode={flash}
      responsiveOrientationWhenOrientationLocked
      videoStabilizationMode="cinematic"
      mute={
        video && microPermission?.status && microPermission.status !== 'granted'
      }
    >
      {photo && (
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
    </ExpoCameraView>
  );
};

export default forwardRef(CameraView);

const styles = StyleSheet.create({
  camera: { flex: 1 },
  flashButton: {
    position: 'absolute',
    bottom: 20,
  },
  flipButton: {
    position: 'absolute',
    bottom: 20,
  },
});
