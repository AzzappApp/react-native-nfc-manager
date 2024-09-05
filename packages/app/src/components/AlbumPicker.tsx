import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { FlatList, Modal, StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { Album } from '@react-native-camera-roll/camera-roll';
import type { IntlShape } from 'react-intl';
import type { ViewProps, ListRenderItemInfo } from 'react-native';

type AlbumPickerProps = ViewProps & {
  album: Album | null;
  onChange(album: Album | null): void;
};

const AlbumPicker = ({
  album,
  onChange,
  style,
  ...props
}: AlbumPickerProps) => {
  const [showModal, setShowModal] = useState(false);

  const onModalOpen = () => {
    setShowModal(true);
  };
  const onModalClose = () => {
    setShowModal(false);
  };
  const onSelectAlbum = (album: Album | null) => {
    setShowModal(false);
    onChange(album);
  };
  const intl = useIntl();
  return (
    <>
      <PressableNative
        style={[styles.root, style]}
        onPress={onModalOpen}
        accessibilityRole="link"
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Select and display the album',
          description: 'Album Picker - Accessibliity label button select album',
        })}
        {...props}
      >
        <Text variant="large" style={styles.title}>
          {album?.title ?? getLatestAlbumLabel(intl)}
        </Text>
        <Icon icon="arrow_down" style={styles.arrowIcon} />
      </PressableNative>
      <Modal
        animationType="slide"
        onRequestClose={onModalClose}
        visible={showModal}
      >
        <AlbumPickerScreen
          onSelectAlbum={onSelectAlbum}
          onClose={onModalClose}
        />
      </Modal>
    </>
  );
};

export default AlbumPicker;

export const AlbumPickerScreen = ({
  onSelectAlbum,
  onClose,
}: {
  onSelectAlbum(album: Album | null): void;
  onClose(): void;
}) => {
  const intl = useIntl();
  const [albums, setAlbums] = useState<Array<Album | null> | null>(null);
  useEffect(() => {
    CameraRoll.getAlbums({
      albumType: 'All',
    }).then(
      albums => {
        const sortedAlbums = albums
          .filter(a => a.count > 0)
          .sort((a, b) => {
            if (a.title?.toLowerCase() === 'recents') {
              return -1;
            } else if (b.title?.toLowerCase() === 'recents') {
              return 1;
            } else if (a.type === 'SmartAlbum' && b.type !== 'SmartAlbum') {
              return 1;
            } else if (a.type !== 'SmartAlbum' && b.type === 'SmartAlbum') {
              return -1;
            } else {
              return (
                a.title?.localeCompare(b.title, undefined, {
                  sensitivity: 'base',
                }) ?? 0
              );
            }
          });
        //TODO test on android if recents album exist or add null
        setAlbums(sortedAlbums);
      },
      e => {
        // TODO
        console.log(e);
      },
    );
  }, []);

  const getAlbumKey = useCallback(
    (_: Album | null, index: number) => `${index}`,
    [],
  );
  const renderAlbum = useCallback(
    ({ item }: ListRenderItemInfo<Album | null>) => (
      <AlbumRendererMemo album={item} onSelectAlbum={onSelectAlbum} />
    ),
    [onSelectAlbum],
  );

  const { top, bottom } = useScreenInsets();
  return (
    <Container style={{ paddingTop: top, flex: 1 }}>
      <Header
        leftElement={<IconButton icon="arrow_left" onPress={onClose} />}
        middleElement={intl.formatMessage({
          defaultMessage: 'Select an album',
          description: 'Title of the album selection modal',
        })}
      />
      <FlatList
        data={albums}
        keyExtractor={getAlbumKey}
        renderItem={renderAlbum}
        contentContainerStyle={{ marginBottom: bottom }}
      />
    </Container>
  );
};

export const getLatestAlbumLabel = (intl: IntlShape) =>
  intl.formatMessage({
    defaultMessage: 'Latest',
    description: 'Latest photos album title in image wizzard album selection ',
  });

const AlbumRenderer = ({
  album,
  onSelectAlbum,
}: {
  album: Album | null;
  onSelectAlbum(album: Album | null): void;
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const intl = useIntl();
  useEffect(() => {
    CameraRoll.getPhotos({
      first: 1,
      groupTypes: album?.type,
      groupName: album?.title,
    }).then(
      result => {
        if (result.edges.length > 0) {
          setImageUri(result.edges[0].node.image.uri);
        }
      },
      e => {
        // TODO
        console.log(e);
      },
    );
  }, [album]);

  const onPress = useCallback(() => {
    onSelectAlbum(album);
  }, [album, onSelectAlbum]);

  return (
    <PressableOpacity onPress={onPress} style={styles.albumRow}>
      <Image
        accessibilityRole="image"
        accessibilityIgnoresInvertColors={true}
        source={(imageUri ? { uri: imageUri } : null) as any}
        style={{
          height: 80,
          width: 80,
          backgroundColor: colors.grey400,
          marginRight: 20,
        }}
      />
      <View>
        <Text variant="medium">
          {album ? album.title : getLatestAlbumLabel(intl)}
        </Text>
        <Text variant="small">{album ? album.count : 'all'}</Text>
      </View>
    </PressableOpacity>
  );
};

const AlbumRendererMemo = memo(AlbumRenderer);
const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginRight: 8,
  },
  arrowIcon: {
    width: 12,
    marginTop: 3,
  },
  albumRow: {
    height: 100,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
