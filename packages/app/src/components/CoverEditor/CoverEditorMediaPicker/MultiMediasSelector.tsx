import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { RESULTS, openPhotoPicker } from 'react-native-permissions';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import AlbumPicker from '#components/AlbumPicker';
import { useRouter } from '#components/NativeRouter';
import PermissionModal from '#components/PermissionModal';
import PhotoGalleryMediaList from '#components/PhotoGalleryMediaList';
import { usePermissionContext } from '#helpers/PermissionContext';
import type { Media } from '#helpers/mediaHelpers';
import type { Album } from '@react-native-camera-roll/camera-roll';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

export type MultiMediasSelectorProps = ViewProps & {
  selectedMedias: Media[] | null;
  onMediaSelected: (media: Media) => void;
};

const MultiMediasSelector = ({
  selectedMedias,
  onMediaSelected,
  style,
  ...props
}: MultiMediasSelectorProps) => {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const { mediaPermission } = usePermissionContext();

  const initialMediaPermission = useRef(mediaPermission);

  const intl = useIntl();

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
            onPress: openPhotoPicker,
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
  const router = useRouter();

  return (
    <>
      <View style={[styles.root, style]} {...props}>
        <View style={styles.header}>
          {(mediaPermission === RESULTS.GRANTED ||
            mediaPermission === RESULTS.LIMITED) && (
            <AlbumPicker album={selectedAlbum} onChange={setSelectedAlbum} />
          )}
        </View>
        <View style={styles.content}>
          {(mediaPermission === RESULTS.GRANTED ||
            mediaPermission === RESULTS.LIMITED) && (
            <PhotoGalleryMediaList
              selectedMediasIds={
                selectedMedias
                  ? convertToNonNullArray(
                      selectedMedias?.map(m => m.galleryUri),
                    )
                  : null
              }
              album={selectedAlbum}
              kind="mixed"
              autoSelectFirstItem={false}
              onMediaSelected={onMediaSelected}
            />
          )}
        </View>
      </View>
      <PermissionModal
        permissionsFor={'gallery'}
        autoFocus
        onRequestClose={() => {
          router.pop(2);
        }}
      />
    </>
  );
};

export default MultiMediasSelector;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    height: 30,
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  content: {
    flex: 1,
  },
  gallery: {
    flexGrow: 1,
  },
});
