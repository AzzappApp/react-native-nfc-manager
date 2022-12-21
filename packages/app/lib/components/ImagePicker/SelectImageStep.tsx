import clamp from 'lodash/clamp';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useCameraPermissions from '../../hooks/useCameraPermissions';
import FloatingIconButton from '../../ui/FloatingIconButton';
import { TAB_BAR_HEIGHT } from '../../ui/TabsBar';
import PermissionModal from '../PermissionModal';
import AlbumPicker from './AlbumPicker';
import CameraControlPanel from './CameraControlPanel';
import CameraView from './CameraView';
import { TOOL_BAR_BOTTOM_MARGIN } from './helpers';
import { useImagePickerState } from './ImagePickerContext';
import { ImagePickerStep } from './ImagePickerWizardContainer';
import { getImageSize, getVideoSize } from './mediaHelpers';
import PhotoGalleryMediaList from './PhotoGalleryMediaList';
import WizardImageEditor from './WizardImagEditor';
import type { CameraViewHandle, RecordSession } from './CameraView';
import type { CameraRuntimeError } from 'react-native-vision-camera';

type SelectImageStepProps = {
  onNext(): void;
  onBack(): void;
};

const SelectImageStep = ({ onBack, onNext }: SelectImageStepProps) => {
  const {
    forceAspectRatio,
    maxVideoDuration,
    media,
    aspectRatio,
    onMediaChange,
    onAspectRatioChange,
  } = useImagePickerState();

  const [pickerMode, setPickerMode] = useState<'gallery' | 'photo' | 'video'>(
    'gallery',
  );

  const { cameraPermission, microphonePermission } = useCameraPermissions();
  const [album, setAlbum] = useState<string | null>(null);
  const [hasGalleryPermission, setHasGalleryPermision] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const hasCameraPermission =
    cameraPermission === 'authorized' || cameraPermission === 'restricted';
  const hasMicrophonePermission =
    microphonePermission === 'authorized' ||
    microphonePermission === 'restricted';

  const onGalleryPermissionFail = () => {
    setHasGalleryPermision(false);
  };

  const onCameraPermissionModalClose = () => {
    if (hasGalleryPermission) {
      setPickerMode('gallery');
    } else {
      setPermissionDenied(true);
    }
  };

  useEffect(() => {
    if (permissionDenied) {
      // we have to dispatch that here to avoid clonflict with modal
      onBack();
    }
  }, [permissionDenied, onBack]);

  const cameraRef = useRef<CameraViewHandle | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);

  const onCameraInitialized = useCallback(() => {
    setCameraInitialized(true);
  }, []);

  const onCameraError = useCallback((error: CameraRuntimeError) => {
    console.log(error);
    // TODO
  }, []);

  const onTakePhoto = useCallback(async () => {
    if (!cameraRef.current) {
      // TODO
      return;
    }
    const path = await cameraRef.current.takePhoto();
    if (!path) {
      // TODO
      return;
    }
    const uri = `file://${path}`;
    const { width, height } = await getImageSize(uri);
    onMediaChange({
      kind: 'image',
      path,
      uri,
      height,
      width,
      aspectRatio: 1,
    });
    onNext();
  }, [onMediaChange, onNext]);

  const captureSession = useRef<RecordSession | null>(null);
  const onStartRecording = useCallback(() => {
    if (!cameraRef.current) {
      // TODO
      return;
    }
    captureSession.current = cameraRef.current.startRecording();
    if (!captureSession.current) {
      // TODO
    }
  }, []);

  const onStopRecording = useCallback(async () => {
    const result = await captureSession.current?.end().catch(() => null);
    if (!result) {
      //TODO
      return;
    }
    const { path, duration } = result;
    const uri = `file://${path}`;
    const { width, height } = await getVideoSize(uri);
    onMediaChange({
      kind: 'video',
      path,
      uri,
      height,
      width,
      duration,
      aspectRatio: 1,
    });
    onNext();
  }, [onMediaChange, onNext]);

  const onAspectRatioToggle = () => {
    if (!media) {
      return;
    }
    const { width, height } = media;
    onAspectRatioChange(
      aspectRatio === 1 ? clampAspectRatio(width / height) : 1,
    );
  };
  const intl = useIntl();
  const { bottom: safeAreaBottom } = useSafeAreaInsets();

  return (
    <>
      <ImagePickerStep
        stepId={SelectImageStep.STEP_ID}
        headerTitle={
          pickerMode === 'gallery' ? (
            <AlbumPicker value={album} onChange={setAlbum} />
          ) : pickerMode === 'photo' ? (
            intl.formatMessage({
              defaultMessage: 'Photo',
              description: 'Title of the photo view in image picker wizzard',
            })
          ) : (
            intl.formatMessage({
              defaultMessage: 'video',
              description: 'Title of the photo view in image picker wizzard',
            })
          )
        }
        preventNavigation={!media}
        topPanel={
          pickerMode === 'gallery' ? (
            media != null ? (
              <>
                <WizardImageEditor />
                {forceAspectRatio == null && media.aspectRatio == null && (
                  <FloatingIconButton
                    icon="adjust"
                    style={styles.adjustButton}
                    variant="white"
                    size={40}
                    onPress={onAspectRatioToggle}
                  />
                )}
              </>
            ) : null
          ) : hasCameraPermission &&
            (pickerMode === 'photo' || hasMicrophonePermission) ? (
            <CameraView
              ref={cameraRef}
              onError={onCameraError}
              onInitialized={onCameraInitialized}
              style={{ width: '100%', height: '100%' }}
            />
          ) : null
        }
        bottomPanel={
          pickerMode === 'gallery' ? (
            <PhotoGalleryMediaList
              selectedMediaURI={media?.mediaId}
              album={album}
              onSelectMedia={onMediaChange}
              onGalleryPermissionFail={onGalleryPermissionFail}
              kind="mixed"
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingBottom:
                  safeAreaBottom + TAB_BAR_HEIGHT + TOOL_BAR_BOTTOM_MARGIN + 10,
              }}
            />
          ) : (
            <CameraControlPanel
              captureMode={pickerMode}
              onTakePhoto={onTakePhoto}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              maxVideoDuration={maxVideoDuration}
              ready={cameraInitialized}
              style={{
                flex: 1,
                marginBottom:
                  safeAreaBottom + TAB_BAR_HEIGHT + TOOL_BAR_BOTTOM_MARGIN,
              }}
            />
          )
        }
        toolbarProps={{
          currentTab: pickerMode,
          onTabPress: setPickerMode as any,
          tabs: [
            {
              icon: 'grid',
              key: 'gallery',
              accessibilityLabel: intl.formatMessage({
                defaultMessage: 'Photos gallery',
                description:
                  'Accessibility label of the Photos gallery tabs in image picking wizzard',
              }),
            },
            {
              icon: 'picture',
              key: 'photo',
              accessibilityLabel: intl.formatMessage({
                defaultMessage: 'Take a picture',
                description:
                  'Accessibility label of the camera tabs in post in image picking wizzard',
              }),
            },
            {
              icon: 'video',
              key: 'video',
              accessibilityLabel: intl.formatMessage({
                defaultMessage: 'Take a video',
                description:
                  'Accessibility label of the video tabs in post  in image picking wizzard',
              }),
            },
          ],
        }}
      />
      <PermissionModal
        visible={
          (pickerMode !== 'gallery' && !hasCameraPermission) ||
          (pickerMode === 'video' && !hasMicrophonePermission) ||
          (!hasGalleryPermission && !permissionDenied)
        }
        permissionsFor={pickerMode}
        onRequestClose={onCameraPermissionModalClose}
      />
    </>
  );
};

SelectImageStep.STEP_ID = 'SELECT_IMAGE';

export default SelectImageStep;

const clampAspectRatio = (aspectRatio: number) =>
  clamp(aspectRatio, MIN_ASPECT_RATIO, MAX_ASPECT_RATIO);

const MAX_ASPECT_RATIO = 2;
const MIN_ASPECT_RATIO = 0.5;

const styles = StyleSheet.create({
  imageEditor: {
    width: '100%',
    height: '100%',
  },
  adjustButton: {
    position: 'absolute',
    left: 25,
    bottom: 20,
  },
});
