import { type Album } from 'expo-media-library';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { RESULTS } from 'react-native-permissions';
import { getImageSize, getVideoSize } from '#helpers/mediaHelpers';
import { usePermissionContext } from '#helpers/PermissionContext';
import useEditorLayout from '#hooks/useEditorLayout';

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
import type { CameraRuntimeError } from 'react-native-vision-camera';

export type SelectImageStepProps = {
  onNext(): void;
  initialCameraPosition?: 'back' | 'front';
};

/**
 * A step of the image picker wizard that allows the user to select an image
 * from the gallery or take a photo/video with the camera.
 */
const SelectImageStep = ({
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

  const [permissionModalRejected, setPermissionModalRejected] = useState(false);

  const onAspectRatioToggle = () => {
    if (!media) {
      return;
    }
    onAspectRatioChange(aspectRatio === 1 ? null : 1);
  };

  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const { mediaPermission, cameraPermission, audioPermission } =
    usePermissionContext();

  const onChangePickerMode = useCallback(
    (mode: 'gallery' | 'photo' | 'video') => {
      //we need to discard the current media if we switch from gallery to video/photo(to desactive the next button)
      if (pickerMode === 'gallery') {
        clearMedia();
      }
      setPermissionModalRejected(false);
      setPickerMode(mode);
    },
    [clearMedia, setPermissionModalRejected, pickerMode],
  );

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

  const onCameraPermissionModalClose = () => {
    if (
      mediaPermission === RESULTS.GRANTED ||
      mediaPermission === RESULTS.LIMITED
    ) {
      onChangePickerMode('gallery');
      setPickerMode('gallery');
    } else {
      setPermissionModalRejected(true);
    }
  };

  const { insetBottom } = useEditorLayout();

  const galleryContainerStyle = useMemo(
    () => ({
      paddingBottom: insetBottom + BOTTOM_MENU_HEIGHT,
    }),
    [insetBottom],
  );

  return (
    <>
      <ImagePickerStep
        stepId={SelectImageStep.STEP_ID}
        headerTitle={
          pickerMode === 'gallery' ? (
            mediaPermission === RESULTS.GRANTED ||
            mediaPermission === RESULTS.LIMITED ? (
              <AlbumPicker album={selectedAlbum} onChange={setSelectedAlbum} />
            ) : null
          ) : pickerMode === 'photo' ? (
            intl.formatMessage({
              defaultMessage: 'Photo',
              description: 'Title of the photo view in image picker wizzard',
            })
          ) : (
            intl.formatMessage({
              defaultMessage: 'Video',
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
          ) : cameraPermission === RESULTS.GRANTED &&
            (pickerMode === 'photo' || audioPermission === RESULTS.GRANTED) ? (
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
        bottomPanel={
          pickerMode === 'gallery' ? (
            mediaPermission === RESULTS.GRANTED ||
            mediaPermission === RESULTS.LIMITED ? (
              <PhotoGalleryMediaList
                selectedMediaID={media?.galleryUri}
                album={selectedAlbum}
                onMediaSelected={onMediaChange}
                kind={kind}
                contentContainerStyle={galleryContainerStyle}
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
        permissionsFor={pickerMode}
        onRequestClose={onCameraPermissionModalClose}
        autoFocus={!permissionModalRejected}
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
