import { presentPermissionsPickerAsync, type Album } from 'expo-media-library';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Platform, View } from 'react-native';
import { RESULTS } from 'react-native-permissions';
import { usePermissionContext } from '#helpers/PermissionContext';
import useEditorLayout, {
  BOTTOM_PANEL_MIN_HEIGHT,
} from '#hooks/useEditorLayout';

import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';

import PermissionModal from '../PermissionModal';
import AlbumPicker from './AlbumPicker';
import { useImagePickerState } from './ImagePickerContext';

import { ImagePickerStep } from './ImagePickerWizardContainer';
import PhotoGalleryMediaList from './PhotoGalleryMediaList';
import type { Media } from './imagePickerTypes';

export type SelectMediaStepProps = {
  onNext: (media: Media) => void;
};

/**
 * A step of the image picker wizard that allows the user to select an image
 * from the gallery or take a photo/video with the camera.
 */
const SelectMediaStep = ({ onNext }: SelectMediaStepProps) => {
  // #region State management
  const { kind, media, onMediaChange } = useImagePickerState();

  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const { mediaPermission } = usePermissionContext();

  const initialMediaPermission = useRef(mediaPermission);

  const { insetBottom } = useEditorLayout();
  const intl = useIntl();

  const galleryContainerStyle = useMemo(
    () => ({
      paddingBottom: insetBottom + BOTTOM_MENU_HEIGHT,
    }),
    [insetBottom],
  );

  const handleMediaSelected = (media: Media) => {
    onMediaChange(media);
    onNext?.(media);
  };

  useEffect(() => {
    if (
      initialMediaPermission.current === RESULTS.LIMITED &&
      Platform.OS === 'ios'
    ) {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: '"azzapp" Would Like to Access Your Photos',
          description: 'Title of the permission picker in image picker wizard',
        }),
        intl.formatMessage({
          defaultMessage:
            'This lets you add photos and videos to your posts and profile.',
          description:
            'Description of the permission picker in image picker wizard',
        }),
        [
          {
            text: intl.formatMessage({
              defaultMessage: 'Select More Photos ...',
              description:
                'Button to open the permission picker in image picker wizard',
            }),
            onPress: presentPermissionsPickerAsync,
          },
          {
            text: intl.formatMessage({
              defaultMessage: 'Keep current selection',
              description:
                'Button to keep the current selection in image picker wizard',
            }),
            onPress: () => {},
            isPreferred: true,
          },
        ],
      );
    }
  }, [intl]);
  // #endregion

  return (
    <>
      <ImagePickerStep
        topPanel={null}
        stepId={SelectMediaStep.STEP_ID}
        headerButtonsShowIfDefined
        headerLeftButton={
          mediaPermission === RESULTS.GRANTED ||
          mediaPermission === RESULTS.LIMITED ? (
            <AlbumPicker album={selectedAlbum} onChange={setSelectedAlbum} />
          ) : null
        }
        headerRightButton={null}
        preventNavigation={!media}
        bottomPanel={({ height }) =>
          mediaPermission === RESULTS.GRANTED ||
          mediaPermission === RESULTS.LIMITED ? (
            <View
              style={{
                height: height + BOTTOM_PANEL_MIN_HEIGHT,
              }}
            >
              <PhotoGalleryMediaList
                selectedMediaID={media?.galleryUri}
                album={selectedAlbum}
                kind={kind}
                contentContainerStyle={galleryContainerStyle}
                autoSelectFirstItem={false}
                onMediaSelected={handleMediaSelected}
              />
            </View>
          ) : null
        }
      />
      <PermissionModal
        permissionsFor={'gallery'}
        autoFocus={false}
        onRequestClose={() => {}}
      />
    </>
  );
};

SelectMediaStep.STEP_ID = 'SELECT_MEDIA';

export default SelectMediaStep;
