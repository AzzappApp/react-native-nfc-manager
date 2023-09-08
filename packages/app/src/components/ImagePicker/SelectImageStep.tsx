import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { getImageSize, getVideoSize } from '#helpers/mediaHelpers';
import useCameraPermissions from '#hooks/useCameraPermissions';
import useMediaLibraryPermission from '#hooks/useMediaLibraryPermission';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import FloatingIconButton from '#ui/FloatingIconButton';
import CameraControlPanel from '../CameraControlPanel';
import CameraView from '../CameraView';
import PermissionModal from '../PermissionModal';
import AlbumPicker from './AlbumPicker';
import { useImagePickerState } from './ImagePickerContext';
import ImagePickerMediaRenderer from './ImagePickerMediaRenderer';
import { ImagePickerStep } from './ImagePickerWizardContainer';
import PhotoGalleryMediaList from './PhotoGalleryMediaList';
import type { FooterBarItem } from '#ui/FooterBar';
import type { CameraViewHandle, RecordSession } from '../CameraView';
import type { Album } from 'expo-media-library';
import type { CameraRuntimeError } from 'react-native-vision-camera';

export type SelectImageStepProps = {
  onNext(): void;
  onBack(): void;
  initialCameraPosition?: 'back' | 'front';
};

/**
 * A step of the image picker wizard that allows the user to select an image
 * from the gallery or take a photo/video with the camera.
 */
const SelectImageStep = ({
  onBack,
  onNext,
  initialCameraPosition,
}: SelectImageStepProps) => {
  // #region State management
  const {
    kind,
    forceAspectRatio,
    forceCameraRatio,
    maxVideoDuration,
    media,
    aspectRatio,
    onMediaChange,
    onAspectRatioChange,
    onEditionParametersChange,
    clearMedia,
  } = useImagePickerState();

  const [pickerMode, setPickerMode] = useState<'gallery' | 'photo' | 'video'>(
    'gallery',
  );

  const onAspectRatioToggle = () => {
    if (!media) {
      return;
    }
    onAspectRatioChange(aspectRatio === 1 ? null : 1);
  };

  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // #region permissions logic
  const { cameraPermission, microphonePermission } = useCameraPermissions();
  const mediaLibraryPermission = useMediaLibraryPermission();

  const [permissionDenied, setPermissionDenied] = useState(false);
  const hasCameraPermission =
    cameraPermission === 'authorized' || cameraPermission === 'restricted';
  const hasMicrophonePermission =
    microphonePermission === 'authorized' ||
    microphonePermission === 'restricted';

  const onChangePickerMode = useCallback(
    (mode: 'gallery' | 'photo' | 'video') => {
      //we need to discard the current media if we switch from gallery to video/photo(to desactive the next button)
      if (pickerMode === 'gallery') {
        clearMedia();
      }
      setPickerMode(mode);
    },
    [clearMedia, pickerMode],
  );

  const onCameraPermissionModalClose = () => {
    if (mediaLibraryPermission?.granted) {
      onChangePickerMode('gallery');
      setPickerMode('gallery');
    } else {
      onBack();
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
    onMediaChange(
      {
        kind: 'image',
        uri,
        height,
        width,
      },
      forceCameraRatio,
    );
    if (forceAspectRatio) {
      let editionParameters = {};
      if (forceAspectRatio < 1) {
        const wantedWidth = height * forceAspectRatio;
        editionParameters = {
          cropData: {
            height,
            originX: (width - wantedWidth) / 2,
            originY: 0,
            width: wantedWidth,
          },
        };
      } else if (forceAspectRatio >= 1) {
        const wantedHeight = width / forceAspectRatio;
        editionParameters = {
          cropData: {
            height: wantedHeight,
            originX: 0,
            originY: (height - wantedHeight) / 2,
            width,
          },
        };
      }
      onEditionParametersChange(editionParameters);
    }
    onNext();
  }, [
    forceAspectRatio,
    forceCameraRatio,
    onEditionParametersChange,
    onMediaChange,
    onNext,
  ]);

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
    onMediaChange(
      {
        kind: 'video',
        uri,
        height,
        width,
        duration,
      },
      forceCameraRatio,
    );
    onNext();
  }, [forceCameraRatio, onMediaChange, onNext]);
  // #endregion

  // #region display logic
  const intl = useIntl();

  const tabs = useMemo(() => {
    const tabs: FooterBarItem[] = [
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
        icon: 'camera',
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
            mediaLibraryPermission?.granted ? (
              <AlbumPicker album={selectedAlbum} onChange={setSelectedAlbum} />
            ) : null
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
              <ImagePickerMediaRenderer>
                {forceAspectRatio == null && (
                  <FloatingIconButton
                    icon={aspectRatio === 1 ? 'reduce' : 'expand'}
                    style={styles.adjustButton}
                    size={40}
                    onPress={onAspectRatioToggle}
                  />
                )}
              </ImagePickerMediaRenderer>
            ) : null
          ) : hasCameraPermission &&
            (pickerMode === 'photo' || hasMicrophonePermission) ? (
            <CameraView
              ref={cameraRef}
              onError={onCameraError}
              onInitialized={onCameraInitialized}
              style={{ flex: 1 }}
              initialCameraPosition={initialCameraPosition}
              photo={pickerMode === 'photo'}
              video={pickerMode === 'video'}
            />
          ) : null
        }
        bottomPanel={({ insetBottom }) =>
          pickerMode === 'gallery' ? (
            mediaLibraryPermission?.granted ? (
              <PhotoGalleryMediaList
                selectedMediaID={media?.galleryUri}
                album={selectedAlbum}
                onMediaSelected={onMediaChange}
                kind={kind}
                contentContainerStyle={{
                  paddingBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
                autoSelectFirstItem={media == null}
              />
            ) : null
          ) : (
            <CameraControlPanel
              captureMode={pickerMode}
              onTakePhoto={onTakePhoto}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              maxVideoDuration={maxVideoDuration}
              ready={cameraInitialized}
              style={[
                styles.cameraControlPanel,
                { marginBottom: insetBottom + BOTTOM_MENU_HEIGHT },
              ]}
            />
          )
        }
        menuBarProps={{
          currentTab: pickerMode,
          onItemPress: onChangePickerMode as any,
          tabs,
        }}
      />
      <PermissionModal
        visible={
          (pickerMode === 'gallery' &&
            mediaLibraryPermission != null &&
            !mediaLibraryPermission.granted) ||
          (pickerMode === 'photo' && !hasCameraPermission) ||
          (pickerMode === 'video' &&
            (!hasCameraPermission || !hasMicrophonePermission))
        }
        permissionsFor={pickerMode}
        onRequestClose={onCameraPermissionModalClose}
      />
    </>
  );
};

SelectImageStep.STEP_ID = 'SELECT_IMAGE';

export const SelectImageStepWithFrontCameraByDefault = (
  props: SelectImageStepProps,
) => {
  return <SelectImageStep {...props} initialCameraPosition="front" />;
};

export default SelectImageStep;

const styles = StyleSheet.create({
  cameraControlPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
