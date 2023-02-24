import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useCallback, useRef, useState, useEffect } from 'react';
import {
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
  Text,
  useWindowDimensions,
} from 'react-native';
import {
  formatVideoTime,
  getImageSize,
  getPHAssetPath,
  getVideoSize,
} from '../../helpers/mediaHelpers';
import { textStyles } from '../../theme';
import PressableNative from '../../ui/PressableNative';
import type { Media } from '../../types';
import type {
  PhotoIdentifier,
  PhotoIdentifiersPage,
  GetPhotosParams,
} from '@react-native-camera-roll/camera-roll';
import type { ScrollViewProps, ListRenderItemInfo } from 'react-native';

type PhotoGalleryMediaListProps = Omit<ScrollViewProps, 'children'> & {
  selectedMediaID?: string;
  album?: string | null;
  onMediaSelected: (media: Media) => void;
  onGalleryPermissionFail: () => void;
  kind: 'image' | 'mixed' | 'video';
};

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

  const dispatchSelectMedia = useCallback(
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
      <PressableNative
        style={[
          {
            width: windowWidth / 3,
            height: windowWidth / 3,
            borderRightWidth: index % 3 !== 2 ? 1 : 0,
            borderBottomWidth: 1,
            borderColor: 'transparent',
          },
          selectedMediaID === item.image.uri && {
            opacity: 0.5,
          },
        ]}
        onPress={() => dispatchSelectMedia(item)}
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
            style={[
              textStyles.button,
              { position: 'absolute', bottom: 10, right: 10, color: 'white' },
            ]}
          >
            {formatVideoTime(item.image.playableDuration)}
          </Text>
        )}
      </PressableNative>
    ),
    [dispatchSelectMedia, selectedMediaID, windowWidth],
  );

  return (
    <FlatList
      numColumns={3}
      data={medias}
      keyExtractor={item => item.image.uri}
      renderItem={renderItem}
      onEndReached={onEndReached}
      style={{ flex: 1 }}
      {...props}
    />
  );
};

export default PhotoGalleryMediaList;
