import {
  CameraRoll,
  progressUpdateEventEmitter,
} from '@react-native-camera-roll/camera-roll';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  AppState,
  Platform,
  View,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { openPhotoPicker, openSettings } from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  formatVideoTime,
  getImageSize,
  getVideoSize,
} from '#helpers/mediaHelpers';
import { usePermissionContext } from '#helpers/PermissionContext';
import useToggle from '#hooks/useToggle';
import ActivityIndicator from '#ui/ActivityIndicator';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import PressableNative from '#ui/PressableNative';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { Media } from '#helpers/mediaHelpers';
import type {
  Album,
  PhotoIdentifier,
} from '@react-native-camera-roll/camera-roll';

import type { FlashListProps, ListRenderItemInfo } from '@shopify/flash-list';

type PhotoGalleryMediaListProps = Omit<
  FlashListProps<PhotoIdentifier>,
  'children' | 'data' | 'onEndReached' | 'renderItem'
> & {
  /**
   * The ID of the media that is currently selected.
   * this id is the uri of the media as in camera roll (phassets on ios).
   */
  selectedMediaId?: string | null;
  /**
   * The IDs of the multiple medias that are currently selected.
   * this id is the uri of the media as in camera roll (phassets on ios).
   */
  selectedMediasIds?: string[] | null;
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

  disableVideoSelection?: boolean | null;
};

/**
 * A component that displays a list of media from the camera roll
 * and allows the user to select one of them.
 */
const PhotoGalleryMediaList = ({
  selectedMediaId,
  selectedMediasIds,
  album,
  kind,
  onMediaSelected,
  autoSelectFirstItem = true,
  numColumns = 4,
  contentContainerStyle,
  disableVideoSelection = null,
  ...props
}: PhotoGalleryMediaListProps) => {
  const scrollViewRef = useRef<FlashList<PhotoIdentifier>>(null);
  const styles = useStyleSheet(styleSheet);
  const [medias, setMedias] = useState<PhotoIdentifier[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const nextCursor = useRef<string | undefined>();
  const { mediaPermission } = usePermissionContext();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const mediaLength = useRef(0);

  const load = useCallback(
    async (refreshing = false, updatePictures = false) => {
      setIsLoadingMore(true);

      try {
        const result = await CameraRoll.getPhotos({
          first: updatePictures ? mediaLength.current || 48 : 48, //multiple of items per row
          after: refreshing ? undefined : nextCursor.current,
          assetType:
            kind === 'mixed' ? 'All' : kind === 'image' ? 'Photos' : 'Videos',
          groupTypes: album?.type,
          groupName: album?.title,
          include: ['playableDuration'],
        });

        const hasNextPage = result.page_info.has_next_page;
        const endCursor = result.page_info.end_cursor;
        const assets = result.edges;

        if (refreshing) {
          scrollViewRef.current?.scrollToIndex({ index: 0 });
        }

        setMedias(previous => {
          const result = refreshing ? assets : [...previous, ...assets];
          mediaLength.current = result.length;
          return result;
        });

        nextCursor.current = endCursor;
        setHasNext(hasNextPage);
      } catch (e) {
        console.log(e);
        return;
      } finally {
        setIsLoadingMore(false);
      }
    },
    [album?.title, album?.type, kind],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  const [downloadingFiles, setDownloadingFiles] = useState<string[]>([]);

  useEffect(() => {
    const subscription = progressUpdateEventEmitter.addListener(
      'onProgressUpdate',
      event => {
        // Render the progress of the image / video being
        // downloaded using event.id and event.progress

        if (event.progress === 1) {
          setDownloadingFiles(previous =>
            previous.includes(event.id)
              ? previous.filter(id => id !== event.id)
              : previous,
          );
        } else {
          setDownloadingFiles(previous => {
            if (!previous.includes(event.id)) {
              return [...previous, event.id];
            }
            return previous;
          });
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const intl = useIntl();

  const onMediaPress = useCallback(
    async (asset: PhotoIdentifier) => {
      let uri: string | null =
        asset.node.image.filepath ?? asset.node.image.uri;

      if (Platform.OS === 'ios') {
        if (asset.node.sourceType === 'CloudShared') {
          setDownloadingFiles(previous => {
            if (!previous.includes(asset.node.id)) {
              return [...previous, asset.node.id];
            }
            return previous;
          });
        }

        const fileData = await CameraRoll.iosGetImageDataById(
          asset.node.image.uri,
        );

        uri = fileData.node.image.filepath;
      } else if (Platform.OS === 'android') {
        const fileData = await ReactNativeBlobUtil.fs.stat(
          asset.node.image.uri,
        );
        uri = `file://${fileData.path}`;
      }

      if (uri == null) {
        // TODO
        return;
      }
      let { width, height, orientation: rotation } = asset.node.image;
      if (asset.node.type.includes('video')) {
        if (disableVideoSelection) {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Maximum number of videos reached',
              description: 'Error message when trying to add more videos',
            }),
            visibilityTime: 2000,
          });
        } else {
          if (width == null || height == null || rotation == null) {
            ({ width, height, rotation } = await getVideoSize(uri));
          }

          onMediaSelected({
            galleryUri: asset.node.image.uri,
            kind: 'video',
            uri,
            width,
            height,
            rotation,
            duration: asset.node.image.playableDuration,
          });
        }
      } else {
        if (width == null || height == null) {
          ({ width, height } = await getImageSize(uri));
        }
        onMediaSelected({
          galleryUri: asset.node.image.uri,
          kind: 'image',
          uri,
          width,
          height,
        });
      }
    },
    [disableVideoSelection, intl, onMediaSelected],
  );

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingMore) {
      void load();
    }
  }, [hasNext, isLoadingMore, load]);

  const itemHeight =
    (useWindowDimensions().width - (numColumns - 1 * SEPARATOR_WIDTH)) /
    numColumns;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PhotoIdentifier>) => (
      <MemoPhotoGalleyMediaItem
        item={item}
        selected={
          selectedMediaId === item.node.image.uri ||
          (selectedMediasIds?.includes(item.node.image.uri ?? '') ?? false)
        }
        isLoading={downloadingFiles.includes(item.node.image.uri)}
        height={itemHeight}
        onMediaPress={onMediaPress}
      />
    ),

    [
      selectedMediaId,
      selectedMediasIds,
      downloadingFiles,
      itemHeight,
      onMediaPress,
    ],
  );

  //should select the first media when the list if no media is selected
  useEffect(() => {
    if (autoSelectFirstItem && selectedMediaId == null && medias?.length > 0) {
      void onMediaPress(medias[0]);
    }
  }, [autoSelectFirstItem, medias, onMediaPress, selectedMediaId]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (nextAppState === 'active') {
          load(true, true);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [load]);

  const extraData = useMemo(
    () => ({ selectedMediasIds, selectedMediaId, downloadingFiles }),
    [selectedMediasIds, selectedMediaId, downloadingFiles],
  );

  const [manageAccessMediaVisible, toggleManageAccessMediaVisible] =
    useToggle(false);

  const ListFooterComponent = useMemo(
    () =>
      isLoadingMore ? (
        <View style={styles.loadingMore}>
          <ActivityIndicator />
        </View>
      ) : null,
    [isLoadingMore, styles.loadingMore],
  );

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
            onPress={toggleManageAccessMediaVisible}
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
        onEndReachedThreshold={medias.length <= 16 ? 0.1 : 0.5}
        drawDistance={1200} //this value will need tweaking with android low end device
        onEndReached={onEndReached}
        accessibilityRole="list"
        contentContainerStyle={contentContainerStyle}
        ItemSeparatorComponent={ItemSeparatorComponent}
        estimatedItemSize={itemHeight}
        extraData={extraData}
        testID="photo-gallery-list"
        ListFooterComponent={ListFooterComponent}
        {...props}
      />
      <BottomSheetModal
        lazy
        showGestureIndicator={false}
        height={200}
        visible={manageAccessMediaVisible}
        onRequestClose={toggleManageAccessMediaVisible}
      >
        <View style={styles.bottomContainer}>
          <PressableOpacity>
            <Text
              variant="medium"
              onPress={async () => {
                //it not waiting the modal ios will not be displayed
                await openPhotoPicker();
                toggleManageAccessMediaVisible();
              }}
            >
              <FormattedMessage
                defaultMessage="Select more photos"
                description="Imagepicker - modal manage more photo"
              />
            </Text>
          </PressableOpacity>
          <PressableOpacity
            onPress={() => {
              openSettings();
              toggleManageAccessMediaVisible();
            }}
          >
            <Text variant="medium">
              <FormattedMessage
                defaultMessage="Change settings"
                description="Imagepicker - modal manage change settings"
              />
            </Text>
          </PressableOpacity>
          <PressableOpacity
            onPress={toggleManageAccessMediaVisible}
            style={styles.cancelMarginTop}
          >
            <Text style={styles.cancelButton}>
              <FormattedMessage
                defaultMessage="Cancel"
                description="Imagepicker - modal manage Cancel"
              />
            </Text>
          </PressableOpacity>
        </View>
      </BottomSheetModal>
    </View>
  );
};

const keyExtractor = (item: PhotoIdentifier) => item.node.id;

// This list can be a litle laggy (due to the library we use for image at the moment).
// Using the RN preconisation for this list to try to improve a bit
type PhotoGalleyMediaItemProps = {
  item: PhotoIdentifier;
  height: number;
  selected: boolean;
  onMediaPress: (media: PhotoIdentifier) => void;
  isLoading: boolean;
  disabled?: boolean;
};

const PhotoGalleyMediaItem = ({
  item,
  selected,
  height,
  onMediaPress,
  isLoading,
  disabled,
}: PhotoGalleyMediaItemProps) => {
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);

  const onPress = useCallback(() => {
    onMediaPress(item);
  }, [item, onMediaPress]);

  return (
    <PressableNative
      style={{
        aspectRatio: 1,
        height,
        position: 'relative',
      }}
      accessibilityRole="button"
      accessibilityHint={intl.formatMessage({
        defaultMessage: 'tap to select this media',
        description:
          'accessibility hint for media selection buttons in photo gallery',
      })}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Image
        accessibilityRole="image"
        accessibilityIgnoresInvertColors={true}
        style={[
          {
            width: height,
            height,
          },
          selected && {
            opacity: 0.5,
          },
        ]}
        source={{ uri: item.node.image.uri, width: height, height }}
        recyclingKey={item.node.id}
      />
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator />
        </View>
      )}
      {item.node.type.includes('video') && (
        <Text variant="button" style={styles.textDuration}>
          {formatVideoTime(item.node.image.playableDuration)}
        </Text>
      )}
    </PressableNative>
  );
};

const ItemSeparatorComponent = () => <View style={separatorStyles.separator} />;

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
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: { justifyContent: 'center', alignItems: 'center' },
  cancelMarginTop: { marginTop: 30 },
  bottomContainer: {
    flex: 1,
    alignItems: 'center',
    rowGap: 30,
    paddingTop: 20,
  },
  cancelButton: {
    color: appearance === 'light' ? colors.grey400 : colors.grey600,
  },
}));

const SEPARATOR_WIDTH = 1;

const separatorStyles = StyleSheet.create({
  separator: { width: SEPARATOR_WIDTH, height: SEPARATOR_WIDTH },
});
