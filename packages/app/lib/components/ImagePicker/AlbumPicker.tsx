import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, textStyles } from '../../../theme';
import Icon from '../../ui/Icon';
import IconButton from '../../ui/IconButton';
import Header from '../Header';
import type { Album } from '@react-native-camera-roll/camera-roll';
import type { IntlShape } from 'react-intl';
import type { ViewProps, ListRenderItemInfo } from 'react-native';

type AlbumPickerProps = ViewProps & {
  value: string | null;
  onChange(album: string): void;
};

// TODO this is barely working we need this feature:
// https://github.com/react-native-cameraroll/react-native-cameraroll/pull/324
const AlbumPicker = ({
  value,
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
  const onSelectAlbum = (album: string) => {
    setShowModal(false);
    onChange(album);
  };
  const intl = useIntl();
  return (
    <>
      <Pressable
        style={({ pressed }) => [
          style,
          styles.root,
          pressed && { opacity: 0.4 },
        ]}
        {...props}
        onPress={onModalOpen}
      >
        <Text style={[textStyles.title, styles.title]}>
          {value ?? latestAlbumTitme(intl)}
        </Text>
        <Icon icon="arrow-down" style={styles.arrowIcon} />
      </Pressable>
      <Modal
        animationType="slide"
        visible={showModal}
        onRequestClose={onModalClose}
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

const AlbumPickerScreen = ({
  onSelectAlbum,
  onClose,
}: {
  onSelectAlbum(album: string | null): void;
  onClose(): void;
}) => {
  const intl = useIntl();
  const [albums, setAlbums] = useState<Album[] | null>(null);
  useEffect(() => {
    CameraRoll.getAlbums().then(
      albums => {
        setAlbums(albums);
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
      <AlbumRenderer
        album={item}
        onPress={() => onSelectAlbum(item?.title ?? null)}
      />
    ),
    [onSelectAlbum],
  );

  const data = useMemo(() => (albums ? [null, ...albums] : null), [albums]);

  const { top, bottom } = useSafeAreaInsets();
  return (
    <View style={{ marginTop: top }}>
      <Header
        leftButton={<IconButton icon="chevron" onPress={onClose} />}
        title={intl.formatMessage({
          defaultMessage: 'Select an album',
          description: 'Title of the album selection modal',
        })}
      />
      <FlatList
        data={data}
        keyExtractor={getAlbumKey}
        renderItem={renderAlbum}
        contentContainerStyle={{ marginBottom: bottom }}
      />
    </View>
  );
};

const latestAlbumTitme = (intl: IntlShape) =>
  intl.formatMessage({
    defaultMessage: 'Latest',
    description: 'Latest photos album title in image wizzard album selection ',
  });

const AlbumRenderer = ({
  album,
  onPress,
}: {
  album: Album | null;
  onPress(): void;
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const intl = useIntl();

  useEffect(() => {
    CameraRoll.getPhotos(
      album
        ? { first: 1, groupTypes: 'Album', groupName: album.title }
        : { first: 1 },
    ).then(
      result => {
        setImageUri(result.edges[0]?.node.image.uri ?? null);
      },
      e => {
        // TODO
        console.log(e);
      },
    );
  }, [album]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.albumRow,
        pressed && styles.albumRowPressed,
      ]}
    >
      <Image
        source={(imageUri ? { uri: imageUri } : null) as any}
        style={{
          height: 80,
          width: 80,
          backgroundColor: colors.grey400,
          marginRight: 20,
        }}
      />
      <View>
        <Text style={textStyles.normal}>
          {album ? album.title : latestAlbumTitme(intl)}
        </Text>
        <Text style={textStyles.small}>{album ? album.count : 'all'}</Text>
      </View>
    </Pressable>
  );
};

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
  albumRowPressed: {
    backgroundColor: colors.grey100,
  },
});
