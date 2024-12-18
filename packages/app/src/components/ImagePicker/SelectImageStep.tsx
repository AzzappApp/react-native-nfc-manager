import * as Sentry from '@sentry/react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { RESULTS } from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import { useDebouncedCallback } from 'use-debounce';
import useMediaLimitedSelectionAlert from '#components/CoverEditor/useMediaLimitedSelectionAlert';
import { useRouter } from '#components/NativeRouter';
import { cropDataForAspectRatio } from '#helpers/mediaEditions';
import { getImageSize, getVideoSize } from '#helpers/mediaHelpers';
import { usePermissionContext } from '#helpers/PermissionContext';
import useEditorLayout from '#hooks/useEditorLayout';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import FloatingIconButton from '#ui/FloatingIconButton';
import AlbumPicker from '../AlbumPicker';
import CameraControlPanel from '../CameraControlPanel';
import CameraView from '../CameraView';
import PermissionModal from '../PermissionModal';
import PhotoGalleryMediaList from '../PhotoGalleryMediaList';
import { useImagePickerState } from './ImagePickerContext';
import ImagePickerMediaRenderer from './ImagePickerMediaRenderer';
import { ImagePickerStep } from './ImagePickerWizardContainer';
import type { SourceMedia } from '#helpers/mediaHelpers';
import type { BottomMenuItem } from '#ui/BottomMenu';
import type { CameraViewHandle } from '../CameraView';
import type { Album } from '@react-native-camera-roll/camera-roll';

export type SelectImageStepProps = {
  onNext(): void;
  initialCameraPosition?: 'back' | 'front';
  hideAspectRatio?: boolean;
  hideTabs?: boolean;
};

/**
 * A step of the image picker wizard that allows the user to select an image
 * from the gallery or take a photo/video with the camera.
 */
const SelectImageStep = ({
  onNext,
  initialCameraPosition,
  hideAspectRatio,
  hideTabs,
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
    cameraButtonsLeftRightPosition,
    minVideoDuration,
  } = useImagePickerState();

  const onGalleryMediaSelected = (
    media: SourceMedia,
    aspectRatio?: number | null | undefined,
  ) => {
    if (
      minVideoDuration &&
      media.kind === 'video' &&
      media.duration < minVideoDuration
    ) {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage(
          {
            defaultMessage: 'Selected video should be at least {duration}s',
            description:
              'Error message when selecting a video media that is too short',
          },
          { duration: Math.ceil(minVideoDuration * 10) / 10 },
        ),
      });
      return;
    }
    onMediaChange(media, aspectRatio);
  };

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

  useMediaLimitedSelectionAlert(mediaPermission);
  const onChangePickerMode = useCallback(
    (mode: 'gallery' | 'photo' | 'video') => {
      //we need to discard the current media if we switch from gallery to video/photo(to desactive the next button)
      if (pickerMode === 'gallery') {
        clearMedia();
      }
      setPermissionModalRejected(false);

      setPickerMode(previousMode => {
        if (previousMode === 'gallery') {
          setCameraInitialized(false);
        }

        return mode;
      });
    },
    [pickerMode, clearMedia],
  );

  // #region camera logic
  const cameraRef = useRef<CameraViewHandle | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);

  const onCameraInitialized = useCallback(() => {
    setCameraInitialized(true);
  }, []);

  const onCameraError = useCallback((error: Error) => {
    console.warn(error);
    // TODO
  }, []);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) {
      // TODO
      return;
    }

    const path = await cameraRef.current.takePhoto();
    if (!path) {
      // TODO
      return;
    }
    const uri = path.startsWith('file://') ? path : `file://${path}`;
    const { width, height } = await getImageSize(uri);

    onMediaChange(
      {
        id: uri,
        kind: 'image',
        uri,
        height,
        width,
        editable: true,
      },
      forceCameraRatio,
    );
    if (forceAspectRatio) {
      onEditionParametersChange({
        cropData: cropDataForAspectRatio(width, height, forceAspectRatio),
      });
    }
    onNext();
  }, [
    forceAspectRatio,
    forceCameraRatio,
    onEditionParametersChange,
    onMediaChange,
    onNext,
  ]);

  const onTakePhoto = useDebouncedCallback(takePhoto, 400);

  const onStartRecording = useCallback(async () => {
    try {
      const result = await cameraRef.current?.startRecording();

      if (result) {
        const duration = result.duration;
        if (duration) {
          const { uri: _uri } = result;
          const uri = _uri.startsWith('file://') ? _uri : `file://${_uri}`;
          const { width, height, rotation } = await getVideoSize(uri);
          onMediaChange(
            {
              id: uri,
              kind: 'video',
              uri,
              height,
              width,
              rotation,
              duration: duration as number,
              editable: true,
            },
            forceCameraRatio,
          );
          onNext();
        }
      }
    } catch (e) {
      console.error(e);
      Sentry.captureException(e);
      /* empty */
    }
  }, [forceCameraRatio, onMediaChange, onNext]);

  const onStopRecording = useCallback(() => {
    cameraRef.current?.stopRecording();
  }, []);

  // #endregion

  // #region display logic
  const intl = useIntl();

  const tabs = useMemo(() => {
    const tabs: BottomMenuItem[] = [
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
  const router = useRouter();
  const onCameraPermissionModalClose = useCallback(() => {
    if (
      mediaPermission === RESULTS.GRANTED ||
      mediaPermission === RESULTS.LIMITED
    ) {
      onChangePickerMode('gallery');
      setPickerMode('gallery');
    } else {
      router.back();
    }
  }, [mediaPermission, onChangePickerMode, router]);

  const { insetBottom } = useEditorLayout();

  const galleryContainerStyle = useMemo(
    () => ({
      paddingBottom: insetBottom + BOTTOM_MENU_HEIGHT,
    }),
    [insetBottom],
  );

  useEffect(() => {
    // ensure media is cleared once we display the Image selection Screen
    clearMedia();
  }, [clearMedia]);

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
            <ImagePickerMediaRenderer>
              {!hideAspectRatio && forceAspectRatio == null && (
                <FloatingIconButton
                  icon={aspectRatio === 1 ? 'reduce' : 'expand'}
                  style={styles.adjustButton}
                  size={40}
                  onPress={onAspectRatioToggle}
                />
              )}
            </ImagePickerMediaRenderer>
          ) : cameraPermission === RESULTS.GRANTED &&
            (pickerMode === 'photo' || audioPermission === RESULTS.GRANTED) ? (
            <CameraView
              ref={cameraRef}
              onError={onCameraError}
              onInitialized={onCameraInitialized}
              style={styles.cameraStyle}
              initialCameraPosition={initialCameraPosition}
              photo={pickerMode === 'photo'}
              video={pickerMode === 'video'}
              cameraButtonsLeftRightPosition={cameraButtonsLeftRightPosition}
            />
          ) : null
        }
        bottomPanel={
          pickerMode === 'gallery' ? (
            mediaPermission === RESULTS.GRANTED ||
            mediaPermission === RESULTS.LIMITED ? (
              <PhotoGalleryMediaList
                selectedMediaId={media?.id}
                album={selectedAlbum}
                onMediaSelected={onGalleryMediaSelected}
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
        menuBarProps={
          !hideTabs
            ? {
                currentTab: pickerMode,
                onItemPress: onChangePickerMode as any,
                tabs,
              }
            : null
        }
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
  adjustButton: {
    position: 'absolute',
    left: 25,
    bottom: 20,
  },
  cameraStyle: { flex: 1 },
});
