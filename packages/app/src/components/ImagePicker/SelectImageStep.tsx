import clamp from 'lodash/clamp';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getImageSize, getVideoSize } from '#helpers/mediaHelpers';
import useCameraPermissions from '#hooks/useCameraPermissions';
import FloatingIconButton from '#ui/FloatingIconButton';
import { TAB_BAR_HEIGHT } from '#ui/TabsBar';
import CameraControlPanel from '../CameraControlPanel';
import CameraView from '../CameraView';
import PermissionModal from '../PermissionModal';
import AlbumPicker from './AlbumPicker';
import { TOOL_BAR_BOTTOM_MARGIN } from './imagePickerConstants';
import { useImagePickerState } from './ImagePickerContext';
import ImagePickerMediaRenderer from './ImagePickerMediaRenderer';
import { ImagePickerStep } from './ImagePickerWizardContainer';
import PhotoGalleryMediaList from './PhotoGalleryMediaList';
import type { Tab } from '#ui/TabsBar';
import type { CameraViewHandle, RecordSession } from '../CameraView';
import type { CameraRuntimeError } from 'react-native-vision-camera';

type SelectImageStepProps = {
  onNext(): void;
  onBack(): void;
};

/**
 * A step of the image picker wizard that allows the user to select an image
 * from the gallery or take a photo/video with the camera.
 */
const SelectImageStep = ({ onBack, onNext }: SelectImageStepProps) => {
  // #region State management
  const {
    kind,
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

  const onAspectRatioToggle = () => {
    if (!media) {
      return;
    }
    const { width, height } = media;
    onAspectRatioChange(
      aspectRatio === 1 ? clampAspectRatio(width / height) : 1,
    );
  };

  const [album, setAlbum] = useState<string | null>(null);
  // #endregion

  // #region permissions logic
  const { cameraPermission, microphonePermission } = useCameraPermissions();
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
  // #endregion

  // #region camera logic
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
      uri,
      height,
      width,
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
      uri,
      height,
      width,
      duration,
    });
    onNext();
  }, [onMediaChange, onNext]);
  // #endregion

  // #region display logic
  const intl = useIntl();
  const { bottom: safeAreaBottom } = useSafeAreaInsets();

  const tabs = useMemo(() => {
    const tabs: Tab[] = [
      {
        icon: 'grid',
        key: 'gallery',
        label: intl.formatMessage({
          defaultMessage: 'Photos gallery',
          description:
            'Accessibility label of the Photos gallery tabs in image picking wizzard',
        }),
      },
    ];
    if (kind !== 'video') {
      tabs.push({
        icon: 'picture',
        key: 'photo',
        label: intl.formatMessage({
          defaultMessage: 'Take a picture',
          description:
            'Accessibility label of the camera tabs in image picking wizzard',
        }),
      });
    }
    if (kind !== 'image') {
      tabs.push({
        icon: 'video',
        key: 'video',
        label: intl.formatMessage({
          defaultMessage: 'Take a video',
          description:
            'Accessibility label of the video tabs in post  in image picking wizzard',
        }),
      });
    }
    return tabs;
  }, [intl, kind]);
  // #endregion

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
                <ImagePickerMediaRenderer />
                {forceAspectRatio == null && (
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
              selectedMediaID={media?.galleryUri}
              album={album}
              onMediaSelected={onMediaChange}
              onGalleryPermissionFail={onGalleryPermissionFail}
              kind={kind}
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
          tabs,
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
