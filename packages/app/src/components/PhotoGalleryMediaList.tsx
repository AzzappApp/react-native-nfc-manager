import {
  CameraRoll,
  progressUpdateEventEmitter,
} from '@react-native-camera-roll/camera-roll';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  AppState,
  Platform,
  View,
  unstable_batchedUpdates,
  useWindowDimensions,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { openPhotoPicker, openSettings } from 'react-native-permissions';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getImageSize, getVideoSize } from '#helpers/mediaHelpers';
import { usePermissionContext } from '#helpers/PermissionContext';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import Container from '#ui/Container';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import MediaGridList from './MediaGridList';
import type { Media } from '#helpers/mediaHelpers';
import type {
  Album,
  PhotoIdentifier,
} from '@react-native-camera-roll/camera-roll';
import type { ContentStyle } from '@shopify/flash-list';
import type { ViewProps } from 'react-native';

type PhotoGalleryMediaListProps = Omit<ViewProps, 'children'> & {
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

  numColumns?: number;
  /**
   * Called when the user selects a media.
   * @param media The media that was selected.
   */
  onMediaSelected: (media: Media) => void;
  /**autoSelectFirstItem */
  autoSelectFirstItem?: boolean;
  contentContainerStyle?: ContentStyle;
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
  ...props
}: PhotoGalleryMediaListProps) => {
  const styles = useStyleSheet(styleSheet);
  const [medias, setMedias] = useState<PhotoIdentifier[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [lastPhotoTimestamp, setLastPhotoTimestamp] = useState<
    number | undefined
  >(undefined);
  const { mediaPermission } = usePermissionContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const mediaLength = useRef(0);

  const load = useCallback(
    async (refreshing = false, updatePictures = false) => {
      unstable_batchedUpdates(() => {
        setIsLoadingMore(true);
        setIsRefreshing(refreshing);
      });

      try {
        const result = await CameraRoll.getPhotos({
          first: updatePictures ? mediaLength.current || 48 : 48, //multiple of items per row
          toTime: refreshing ? undefined : lastPhotoTimestamp,
          assetType:
            kind === 'mixed' ? 'All' : kind === 'image' ? 'Photos' : 'Videos',
          groupTypes: album?.type,
          groupName: album?.title,
          include: ['playableDuration'],
        });

        const hasNextPage = result.page_info.has_next_page;
        const assets = result.edges;
        const endTimestamp = assets[assets.length - 1]?.node.timestamp;

        setMedias(previous => {
          const result = refreshing ? assets : [...previous, ...assets];
          mediaLength.current = result.length;
          return result;
        });

        if (endTimestamp) {
          setLastPhotoTimestamp(Math.round(endTimestamp * 1000) - 1);
        }
        setHasNext(hasNextPage);
      } catch (e) {
        console.log(e);
        return;
      } finally {
        unstable_batchedUpdates(() => {
          setIsLoadingMore(false);
          setIsRefreshing(false);
        });
      }
    },
    [album?.title, album?.type, kind, lastPhotoTimestamp],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  const [filesDownloading, setFilesDownloading] = useState<string[]>([]);

  useEffect(() => {
    const subscription = progressUpdateEventEmitter.addListener(
      'onProgressUpdate',
      event => {
        // Render the progress of the image / video being
        // downloaded using event.id and event.progress

        if (event.progress === 1) {
          setFilesDownloading(previous =>
            previous.includes(event.id)
              ? previous.filter(id => id !== event.id)
              : previous,
          );
        } else {
          setFilesDownloading(previous => {
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
          setFilesDownloading(previous => {
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
    [onMediaSelected],
  );

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingMore) {
      void load();
    }
  }, [hasNext, isLoadingMore, load]);

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

  const [manageAccessMediaVisible, toggleManageAccessMediaVisible] =
    useToggle(false);

  const selectedMediaIdsInner = useMemo(() => {
    if (selectedMediasIds) {
      return selectedMediasIds;
    }
    return selectedMediaId ? [selectedMediaId] : [];
  }, [selectedMediaId, selectedMediasIds]);

  const { width: windowWidth } = useWindowDimensions();

  return (
    <Container style={styles.container}>
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
      <MediaGridList
        medias={medias}
        selectedMediaIds={selectedMediaIdsInner}
        filesDownloading={filesDownloading}
        refreshing={isRefreshing}
        isLoadingMore={isLoadingMore}
        numColumns={numColumns}
        width={windowWidth}
        contentContainerStyle={contentContainerStyle}
        getItemId={getPhotoUri}
        getItemUri={getPhotoUri}
        getItemDuration={getPhotoDuration}
        onSelect={onMediaPress}
        onEndReached={onEndReached}
        testID="photo-gallery-list"
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
    </Container>
  );
};

const getPhotoUri = (item: PhotoIdentifier) => item.node.image.uri;

const getPhotoDuration = (item: PhotoIdentifier) =>
  item.node.type.includes('video')
    ? item.node.image.playableDuration
    : undefined;

export default PhotoGalleryMediaList;

const styleSheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
  },
  manageAccessMediaText: {
    flex: 1,
    flexWrap: 'wrap',
    alignContent: 'center',
    textAlignVertical: 'center',
    marginLeft: 16,
    marginRight: 16,
  },
  buttonManageAccessMedia: { marginVertical: 7, marginRight: 16 },
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
