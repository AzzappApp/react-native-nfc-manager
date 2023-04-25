import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useCallback, useRef, useState, useEffect, memo } from 'react';
import { useIntl } from 'react-intl';
import {
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import {
  formatVideoTime,
  getImageSize,
  getPHAssetPath,
  getVideoSize,
} from '#helpers/mediaHelpers';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { Media } from './imagePickerTypes';
import type {
  PhotoIdentifier,
  PhotoIdentifiersPage,
  GetPhotosParams,
} from '@react-native-camera-roll/camera-roll';
import type { ScrollViewProps, ListRenderItemInfo } from 'react-native';

type PhotoGalleryMediaListProps = Omit<ScrollViewProps, 'children'> & {
  /**
   * The ID of the media that is currently selected.
   * this id is the uri of the media as in camera roll (phassets on ios).
   */
  selectedMediaID?: string;
  /**
   * The kind of media to display.
   */
  kind: 'image' | 'mixed' | 'video';
  /**
   * Allows the list to be filtered by album.
   */
  album?: string | null;
  /**
   * Called when the user selects a media.
   * @param media The media that was selected.
   */
  onMediaSelected: (media: Media) => void;
  /**
   * Called when the user denies the gallery permission.
   */
  onGalleryPermissionFail: () => void;
};

/**
 * A component that displays a list of media from the camera roll
 * and allows the user to select one of them.
 */
const PhotoGalleryMediaList = ({
  selectedMediaID,
  album,
  kind,
  onMediaSelected,
  onGalleryPermissionFail,
  ...props
}: PhotoGalleryMediaListProps) => {
  const [medias, setMedias] = useState<Array<PhotoIdentifier['node']>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);
  const endCursor = useRef<string | undefined>();

  const onGalleryPermissionFailRef = useRef(onGalleryPermissionFail);
  onGalleryPermissionFailRef.current = onGalleryPermissionFail;
  const load = useCallback(
    async (refreshing = false) => {
      setIsLoading(true);
      let result: PhotoIdentifiersPage;

      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Permission Explanation',
            message: 'Azzapp would like to access your pictures.',
            buttonPositive: 'OK',
          },
        );
        if (result !== 'granted') {
          onGalleryPermissionFailRef.current?.();
          return;
        }
      }

      try {
        const params: GetPhotosParams = {
          first: 30,
          assetType:
            kind === 'mixed' ? 'All' : kind === 'video' ? 'Videos' : 'Photos',
          after: endCursor.current,
          include: ['imageSize', 'playableDuration'],
        };
        if (album) {
          params.groupTypes = 'Album';
          params.groupName = album;
        }
        result = await CameraRoll.getPhotos(params);
      } catch (e) {
        onGalleryPermissionFailRef.current?.();
        return;
      }

      const {
        edges,
        page_info: { end_cursor, has_next_page },
      } = result;

      const newMedias = edges.map(({ node }) => node);
      setMedias(refreshing ? newMedias : medias => medias.concat(newMedias));
      endCursor.current = end_cursor;
      setHasNext(has_next_page);
      setIsLoading(false);
    },
    [kind, album],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  const onMediaPress = useCallback(
    async ({
      image: { uri: galleryUri, height, width, playableDuration },
      type,
    }: PhotoIdentifier['node']) => {
      let uri: string | null = galleryUri;
      if (Platform.OS === 'ios') {
        uri = await getPHAssetPath(galleryUri);
      }
      if (uri == null) {
        // TODO
        return;
      }
      if (type.startsWith('video')) {
        if (width == null || height == null) {
          ({ width, height } = await getVideoSize(uri));
        }
        onMediaSelected({
          galleryUri,
          kind: 'video',
          uri,
          width,
          height,
          duration: playableDuration,
        });
      } else {
        if (width == null || height == null) {
          ({ width, height } = await getImageSize(uri));
        }
        onMediaSelected({
          galleryUri,
          kind: 'image',
          uri,
          width,
          height,
        });
      }
    },
    [onMediaSelected],
  );

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoading) {
      void load();
    }
  }, [hasNext, isLoading, load]);

  const { width: windowWidth } = useWindowDimensions();

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<PhotoIdentifier['node']>) => (
      <MemoPhotoGalleyMediaItem
        item={item}
        index={index}
        width={windowWidth / ITEM_PER_ROW}
        selected={selectedMediaID === item.image.uri}
        onMediaPress={onMediaPress}
      />
    ),

    [onMediaPress, selectedMediaID, windowWidth],
  );

  return (
    <FlatList
      numColumns={ITEM_PER_ROW}
      data={medias}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      style={[styles.flatListStyle]}
      accessibilityRole="list"
      {...props}
    />
  );
};

const keyExtractor = (item: PhotoIdentifier['node']) => item.image.uri;

// This list can be a litle laggy (due to the library we use for image at the moment). Using the RN preconisation for this list to try to improve a bit
type PhotoGalleyMediaItemProps = {
  item: PhotoIdentifier['node'];
  index: number;
  width: number;
  selected: boolean;
  onMediaPress: (media: PhotoIdentifier['node']) => void;
};
const PhotoGalleyMediaItem = ({
  item,
  index,
  width,
  selected,
  onMediaPress,
}: PhotoGalleyMediaItemProps) => {
  const intl = useIntl();

  const onPress = () => {
    onMediaPress(item);
  };
  return (
    <PressableNative
      style={[
        {
          width,
          height: width,
          borderRightWidth: index % ITEM_PER_ROW !== 3 ? 1 : 0,
          borderBottomWidth: 1,
          borderColor: 'transparent',
        },
        selected && {
          opacity: 0.5,
        },
      ]}
      accessibilityRole="button"
      accessibilityHint={intl.formatMessage({
        defaultMessage: 'tap to select this media',
        description:
          'accessibility hint for media selection buttons in photo gallery',
      })}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        accessibilityRole="image"
        accessibilityIgnoresInvertColors={true}
        style={{
          flex: 1,
          resizeMode: 'cover',
        }}
        source={{ uri: item.image.uri }}
      />
      {item.type.startsWith('video') && (
        <Text
          variant="button"
          style={[
            { position: 'absolute', bottom: 10, right: 10, color: 'white' },
          ]}
        >
          {formatVideoTime(item.image.playableDuration)}
        </Text>
      )}
    </PressableNative>
  );
};
const MemoPhotoGalleyMediaItem = memo(PhotoGalleyMediaItem);

const ITEM_PER_ROW = 4;

export default PhotoGalleryMediaList;

const styles = StyleSheet.create({
  flatListStyle: { flex: 1 },
});
