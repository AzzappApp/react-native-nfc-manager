import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import {
  addListener,
  getAssetInfoAsync,
  getAssetsAsync,
  presentPermissionsPickerAsync,
  removeAllListeners,
} from 'expo-media-library';
import { useCallback, useRef, useState, useEffect, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Platform, useWindowDimensions, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  formatVideoTime,
  getImageSize,
  getVideoSize,
} from '#helpers/mediaHelpers';
import { usePermissionContext } from '#helpers/PermissionContext';
import Button from '#ui/Button';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { Media } from './imagePickerTypes';

import type { FlashListProps, ListRenderItemInfo } from '@shopify/flash-list';
import type { Album, Asset } from 'expo-media-library';
type PhotoGalleryMediaListProps = Omit<
  FlashListProps<Asset>,
  'children' | 'data' | 'onEndReached' | 'renderItem'
> & {
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
  album: Album | null;
  /**
   * Called when the user selects a media.
   * @param media The media that was selected.
   */
  onMediaSelected: (media: Media) => void;
  /**autoSelectFirstItem */
  autoSelectFirstItem?: boolean;
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
  autoSelectFirstItem = true,
  numColumns = 4,
  contentContainerStyle,
  ...props
}: PhotoGalleryMediaListProps) => {
  const scrollViewRef = useRef<FlashList<Asset>>(null);
  const styles = useStyleSheet(styleSheet);
  const [medias, setMedias] = useState<Asset[]>([]);
  const isLoading = useRef(false);
  const [hasNext, setHasNext] = useState(false);
  const nextCursor = useRef<string | undefined>();
  const { mediaPermission } = usePermissionContext();

  const load = useCallback(
    async (refreshing = false) => {
      if (!isLoading.current) {
        isLoading.current = true;
        const previous = refreshing ? [] : [...medias];
        try {
          const result = await getAssetsAsync({
            first: refreshing ? 16 : 48, //multiple of items per row
            after: refreshing ? undefined : nextCursor.current,
            mediaType:
              kind === 'mixed'
                ? ['photo', 'video']
                : kind === 'image'
                  ? ['photo']
                  : ['video'],
            sortBy: ['creationTime'],
            album: album ?? undefined,
          });

          const { assets, endCursor, hasNextPage } = result;
          setMedias([...previous, ...assets]);
          nextCursor.current = endCursor;
          setHasNext(hasNextPage);
        } catch (e) {
          console.log(e);
          return;
        } finally {
          isLoading.current = false;
        }
      }
    },
    [album, kind, medias],
  );

  useEffect(() => {
    //force preload more data and inital render,
    if (medias.length === 16 && hasNext) {
      void load(false);
    }
  }, [hasNext, load, medias.length]);

  useEffect(() => {
    if (!isLoading.current) {
      nextCursor.current = undefined;
      setHasNext(false);
      void load(true);
    }
  }, [album, load]);

  const onMediaPress = useCallback(
    async (asset: Asset) => {
      let uri: string | null = asset.uri;
      const assets = await getAssetInfoAsync(asset.id);
      uri = assets.localUri ?? uri;

      if (uri == null) {
        // TODO
        return;
      }
      let { width, height } = asset;
      if (asset.mediaType === 'video') {
        if (asset.width == null || asset.height == null) {
          ({ width, height } = await getVideoSize(uri));
        }
        onMediaSelected({
          galleryUri: asset.uri,
          kind: 'video',
          uri,
          width,
          height,
          duration: asset.duration,
        });
      } else {
        if (width == null || height == null) {
          ({ width, height } = await getImageSize(uri));
        }
        onMediaSelected({
          galleryUri: asset.uri,
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
    if (hasNext && !isLoading.current) {
      void load();
    }
  }, [hasNext, isLoading, load]);

  const itemHeight =
    (useWindowDimensions().width - (numColumns - 1 * SEPARATOR_WIDTH)) /
    numColumns;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Asset>) => (
      <MemoPhotoGalleyMediaItem
        item={item}
        selected={selectedMediaID === item.id}
        height={itemHeight}
        onMediaPress={onMediaPress}
      />
    ),

    [itemHeight, onMediaPress, selectedMediaID],
  );

  //should select the first media when the list if no media is selected
  useEffect(() => {
    if (autoSelectFirstItem && selectedMediaID == null && medias?.length > 0) {
      void onMediaPress(medias[0]);
    }
  }, [autoSelectFirstItem, medias, onMediaPress, selectedMediaID]);

  useEffect(() => {
    addListener(() => {
      load(true);
    });

    return () => {
      removeAllListeners();
    };
  }, [load]);

  const intl = useIntl();

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' && mediaPermission === 'limited' && (
        <View style={{ flexDirection: 'row' }}>
          <Text
            variant="smallbold"
            style={styles.manageAccessMediaText}
            numberOfLines={2}
          >
            <FormattedMessage
              defaultMessage={
                'You’ve given azzapp access to a selected number of photos and videos'
              }
              description="ImagePicker Media library - Message when user did not authorize access to media or partially authorize"
            />
          </Text>
          <Button
            variant="little_round"
            onPress={presentPermissionsPickerAsync}
            label={intl.formatMessage({
              defaultMessage: 'Manage',
              description: 'Button to manage media permissions',
            })}
            style={styles.buttonManageAccessMedia}
          />
        </View>
      )}
      <FlashList
        ref={scrollViewRef}
        numColumns={numColumns}
        data={medias}
        showsVerticalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReachedThreshold={medias.length <= 16 ? 0.1 : 1.5}
        drawDistance={1200} //this value will need tweaking with android low end device
        onEndReached={onEndReached}
        accessibilityRole="list"
        contentContainerStyle={contentContainerStyle}
        ItemSeparatorComponent={ItemSeparatorComponent}
        {...props}
        estimatedItemSize={itemHeight}
        testID="photo-gallery-list"
      />
    </View>
  );
};

const keyExtractor = (item: Asset) => item.id;

// This list can be a litle laggy (due to the library we use for image at the moment). Using the RN preconisation for this list to try to improve a bit
type PhotoGalleyMediaItemProps = {
  item: Asset;
  height: number;
  selected: boolean;
  onMediaPress: (media: Asset) => void;
};
const PhotoGalleyMediaItem = ({
  item,
  selected,
  height,
  onMediaPress,
}: PhotoGalleyMediaItemProps) => {
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);

  const onPress = useCallback(() => {
    onMediaPress(item);
  }, [item, onMediaPress]);

  return (
    <PressableNative
      style={[
        {
          aspectRatio: 1,
          height,
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
          width: height,
          height,
        }}
        source={{ uri: item.uri, width: height, height }}
        recyclingKey={item.id}
      />
      {item.mediaType === 'video' && (
        <Text variant="button" style={styles.textDuration}>
          {formatVideoTime(item.duration)}
        </Text>
      )}
    </PressableNative>
  );
};

const ItemSeparatorComponent = () => (
  <View style={{ width: SEPARATOR_WIDTH, height: SEPARATOR_WIDTH }} />
);

const MemoPhotoGalleyMediaItem = memo(PhotoGalleyMediaItem);

export default PhotoGalleryMediaList;

const styleSheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  textDuration: { position: 'absolute', bottom: 10, right: 10, color: 'white' },
  flatListStyle: { flex: 1 },
  manageAccessMediaText: {
    flex: 1,
    flexWrap: 'wrap',
    alignContent: 'center',
    textAlignVertical: 'center',
    marginLeft: 16,
    marginRight: 16,
  },
  buttonManageAccessMedia: { marginVertical: 7, marginRight: 16 },
}));

const SEPARATOR_WIDTH = 1;
