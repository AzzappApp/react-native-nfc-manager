import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { PhotoGallery } from 'react-native-photo-gallery-api';
import { colors, textStyles } from '../../../theme';
import { formatVideoTime } from './helpers';
import usePhotoGalleryPermission from './usePhotoGalleryPermission';
import type { MediaKind } from './helpers';
import type { ScrollViewProps } from 'react-native';
import type { PhotoIdentifier } from 'react-native-photo-gallery-api';

type PhotoGalleryMediaListProps = Omit<ScrollViewProps, 'children'> & {
  selectedMediaURI?: string;
  onSelectMedia: (item: PhotoIdentifier['node']) => void;
  onPermissionRequestFailed: () => void;
  kind: MediaKind;
};

const PhotoGalleryMediaList = ({
  selectedMediaURI,
  kind,
  onSelectMedia,
  onPermissionRequestFailed,
  ...props
}: PhotoGalleryMediaListProps) => {
  const canUsePhotoGallery = usePhotoGalleryPermission(
    onPermissionRequestFailed,
  );
  const [medias, setMedias] = useState<Array<PhotoIdentifier['node']>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);
  const endCursor = useRef<string | undefined>();

  const load = useCallback(
    async (refreshing = false) => {
      setIsLoading(true);
      const {
        edges,
        page_info: { has_next_page, end_cursor },
      } = await PhotoGallery.getPhotos({
        first: 30,
        assetType:
          kind === 'mixed' ? 'All' : kind === 'video' ? 'Videos' : 'Photos',
        after: endCursor.current,
      });
      // TODO error handling

      const newMedias = edges.map(({ node }) => node);
      setMedias(refreshing ? newMedias : medias => medias.concat(newMedias));
      endCursor.current = end_cursor;
      setHasNext(has_next_page);
      setIsLoading(false);
    },
    [kind],
  );

  useEffect(() => {
    if (canUsePhotoGallery) {
      void load(true);
    }
  }, [canUsePhotoGallery, kind, load]);

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoading) {
      void load();
    }
  }, [hasNext, isLoading, load]);

  const { width: windowWidth } = useWindowDimensions();

  if (!canUsePhotoGallery) {
    return (
      <View style={{ flex: 1 }}>
        <ActivityIndicator style={{ alignSelf: 'center', marginTop: 100 }} />
      </View>
    );
  }

  return (
    <FlatList
      numColumns={3}
      data={medias}
      keyExtractor={item => item.image.uri}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [
            {
              width: (windowWidth - 4) / 3,
              height: (windowWidth - 4) / 3,
              borderWidth: 2,
              borderColor: 'transparent',
            },
            selectedMediaURI === item.image.uri && {
              borderColor: colors.blue,
            },
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => onSelectMedia(item)}
        >
          <Image
            style={{
              flex: 1,
              resizeMode: 'cover',
            }}
            source={{ uri: item.image.uri }}
          />
          {item.type === 'video' && (
            <Text
              style={[
                textStyles.button,
                { position: 'absolute', bottom: 10, right: 10, color: 'white' },
              ]}
            >
              {formatVideoTime(item.image.playableDuration)}
            </Text>
          )}
        </Pressable>
      )}
      contentContainerStyle={{ justifyContent: 'space-around' }}
      onEndReached={onEndReached}
      style={{ flex: 1, paddingHorizontal: 2 }}
      {...props}
    />
  );
};

export default PhotoGalleryMediaList;
