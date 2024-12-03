import { startTransition, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { RESULTS } from 'react-native-permissions';
import {
  AlbumPickerScreen,
  getLatestAlbumLabel,
} from '#components/AlbumPicker';
import { MediaGridListFallback } from '#components/MediaGridList';
import { ScreenModal } from '#components/NativeRouter';
import PermissionModal from '#components/PermissionModal';
import PhotoGalleryMediaList from '#components/PhotoGalleryMediaList';
import { usePermissionContext } from '#helpers/PermissionContext';
import useMediaLimitedSelectionAlert from '#hooks/useMediaLimitedSelectionAlert';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import TabsBar from '#ui/TabsBar';
import TabView from '#ui/TabView';
import StockMediaList from './StockMediaList';
import type { SourceMedia } from '#helpers/mediaHelpers';
import type { Album } from '@react-native-camera-roll/camera-roll';
import type { ReactElement } from 'react';
import type { ViewProps } from 'react-native';

type MediaPickerProps = Omit<ViewProps, 'children'> & {
  onMediaSelected: (media: SourceMedia) => void;
  Header: ReactElement;
  BottomPanel: ReactElement | null;
  /**
    Callback when the user closes the media picker
   *
   */
  onClose: () => void;
  /**
   * allow video selection
   *
   * @type {boolean}
   */
  allowVideo?: boolean;
  /**
   * list of already selected media
   *
   */
  selectedMediasIds: string[];
};

const MediaPicker = ({
  onMediaSelected,
  Header,
  selectedMediasIds,
  allowVideo,
  BottomPanel,
  onClose,
  style,
  ...props
}: MediaPickerProps) => {
  const intl = useIntl();

  const [selectedTab, setSelectedTab] = useState('gallery');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [showAlbumModal, toggleShowAlbumModal] = useToggle(false);

  const onSelectAlbum = useCallback(
    (album: Album | null) => {
      setSelectedAlbum(album);
      toggleShowAlbumModal();
    },
    [toggleShowAlbumModal],
  );

  const { mediaPermission } = usePermissionContext();
  useMediaLimitedSelectionAlert(mediaPermission);

  const onTabPress = useCallback(
    (tab: string) => {
      startTransition(() => {
        if (tab === 'gallery' && selectedTab === 'gallery') {
          toggleShowAlbumModal();
        } else {
          setSelectedTab(tab);
        }
      });
    },
    [selectedTab, toggleShowAlbumModal],
  );

  const tabs = useMemo(() => {
    const result = [
      {
        tabKey: 'gallery',
        label: selectedAlbum?.title ?? getLatestAlbumLabel(intl),
        rightElement: <Icon icon="arrow_down" style={styles.arrowIcon} />,
      },
      {
        tabKey: 'stock_photo',
        label: intl.formatMessage({
          defaultMessage: 'Stock Photos',
          description: 'Label for the stock photos tab in the Media picker',
        }),
      },
    ];
    if (allowVideo) {
      result.push({
        tabKey: 'stock_video',
        label: intl.formatMessage({
          defaultMessage: 'Stock Videos',
          description: 'Label for the stock videos tab in the Media picker',
        }),
      });
    }
    return result;
  }, [selectedAlbum?.title, intl, allowVideo]);

  const { top, bottom } = useScreenInsets();
  const { width: windowWidth } = useWindowDimensions();
  return (
    <>
      <Container
        {...props}
        style={[style, styles.root, { paddingBottom: bottom, paddingTop: top }]}
      >
        <View style={styles.headerSection}>
          {Header}
          <TabsBar
            tabs={tabs}
            currentTab={selectedTab}
            onTabPress={onTabPress}
            decoration="underline"
            style={styles.gallery}
          />
        </View>
        <TabView
          style={styles.content}
          currentTab={selectedTab}
          mountOnlyCurrentTab
          tabs={[
            {
              id: 'gallery',
              element:
                // we partially unmount the gallery to avoid performance issues
                selectedTab === 'gallery' &&
                (mediaPermission === RESULTS.GRANTED ||
                  mediaPermission === RESULTS.LIMITED) ? (
                  <PhotoGalleryMediaList
                    selectedMediasIds={selectedMediasIds}
                    album={selectedAlbum}
                    kind={allowVideo ? 'mixed' : 'image'}
                    autoSelectFirstItem={false}
                    onMediaSelected={onMediaSelected}
                  />
                ) : (
                  <MediaGridListFallback numColumns={4} width={windowWidth} />
                ),
            },
            {
              id: 'stock_photo',
              element: (
                <StockMediaList
                  kind="image"
                  selectedMediasIds={selectedMediasIds}
                  onMediaSelected={onMediaSelected}
                />
              ),
            },
            {
              id: 'stock_video',
              element: (
                <StockMediaList
                  kind="video"
                  selectedMediasIds={selectedMediasIds}
                  onMediaSelected={onMediaSelected}
                />
              ),
            },
          ]}
        />
        {BottomPanel}
      </Container>
      <PermissionModal
        permissionsFor={'gallery'}
        autoFocus
        onRequestClose={onClose}
      />
      {(mediaPermission === RESULTS.GRANTED ||
        mediaPermission === RESULTS.LIMITED) && (
        <ScreenModal
          visible={showAlbumModal}
          onRequestDismiss={toggleShowAlbumModal}
          animationType="slide"
        >
          <AlbumPickerScreen
            onSelectAlbum={onSelectAlbum}
            onClose={toggleShowAlbumModal}
          />
        </ScreenModal>
      )}
    </>
  );
};

export default MediaPicker;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerSection: {
    gap: 15,
    marginBottom: 15,
  },
  content: {
    flex: 1,
  },
  gallery: {
    flexGrow: 1,
  },
  arrowIcon: {
    width: 12,
    marginTop: 3,
  },
});
