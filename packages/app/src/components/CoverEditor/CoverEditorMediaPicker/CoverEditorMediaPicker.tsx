import { Image } from 'expo-image';
import { startTransition, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, Alert, useWindowDimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { RESULTS } from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import {
  COVER_IMAGE_DEFAULT_DURATION,
  COVER_MAX_MEDIA,
} from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import {
  AlbumPickerScreen,
  getLatestAlbumLabel,
} from '#components/AlbumPicker';
import {
  CancelHeaderButton,
  SaveHeaderButton,
} from '#components/commonsButtons';
import { MediaGridListFallback } from '#components/MediaGridList';
import { ScreenModal } from '#components/NativeRouter';
import PermissionModal from '#components/PermissionModal';
import PhotoGalleryMediaList from '#components/PhotoGalleryMediaList';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { usePermissionContext } from '#helpers/PermissionContext';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import TabsBar from '#ui/TabsBar';
import TabView from '#ui/TabView';
import Text from '#ui/Text';
import { duplicateMediaToFillSlots } from '../coverEditorHelpers';
import useMediaLimitedSelectionAlert from '../useMediaLimitedSelectionAlert';
import StockMediaList from './StockMediaList';
import type { SourceMedia } from '#helpers/mediaHelpers';
import type { Album } from '@react-native-camera-roll/camera-roll';
import type { ViewProps } from 'react-native';

type CoverEditorMediaPickerProps = Omit<ViewProps, 'children'> & {
  durations: number[] | null;
  durationsFixed?: boolean;
  initialMedias: Array<SourceMedia | null> | null;
  onFinished: (results: SourceMedia[]) => void;
  maxSelectableVideos?: number;
  onClose: () => void;
  /**
   * Simple media selection to avoid having the bottom panel
   *
   * @type {boolean}
   */
  multiSelection?: boolean;
  /**
   * allow video selection
   *
   * @type {boolean}
   */
  allowVideo?: boolean;
};

const CoverEditorMediaPicker = ({
  durations,
  durationsFixed,
  initialMedias,
  onFinished,
  style,
  maxSelectableVideos,
  onClose,
  multiSelection = true,
  allowVideo = true,
  ...props
}: CoverEditorMediaPickerProps) => {
  const [selectedMedias, setSelectedMedias] = useState<
    Array<SourceMedia | null>
  >(initialMedias ?? []);
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

  const intl = useIntl();
  const styles = useStyleSheet(stylesheet);

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
          description:
            'Label for the stock photos tab in the cover Media picker',
        }),
      },
    ];
    if (allowVideo) {
      result.push({
        tabKey: 'stock_video',
        label: intl.formatMessage({
          defaultMessage: 'Stock Videos',
          description:
            'Label for the stock videos tab in the cover Media picker',
        }),
      });
    }
    return result;
  }, [selectedAlbum?.title, intl, styles.arrowIcon, allowVideo]);

  const maxMedias = !multiSelection
    ? 1
    : durationsFixed && durations
      ? durations.length
      : COVER_MAX_MEDIA;

  // remove Media by index
  const handleRemoveMedia = (index: number) => {
    setSelectedMedias(prevSelectedMedias => [
      ...prevSelectedMedias.filter((_, i) => i !== index),
      null,
    ]);
  };

  const selectedMediasIds = useMemo(
    () =>
      selectedMedias
        ?.filter(selectedMedia => !!selectedMedia)
        .map(media => media.id) ?? [],
    [selectedMedias],
  );

  // @todo better define the expected type according to the evolution of the new cover
  const handleMediaSelected = useCallback(
    (media: SourceMedia) => {
      if (!multiSelection) {
        setSelectedMedias([media]);
        return;
      }
      const disableVideoSelection = maxSelectableVideos
        ? maxSelectableVideos -
            (selectedMedias?.filter(m => m?.kind === 'video').length ?? 0) ===
          0
        : false;

      const index = selectedMedias.findIndex(
        value => value && value.id === media.id,
      );

      if (disableVideoSelection && index === -1 && media.kind === 'video') {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Maximum number of videos reached',
            description: 'Error message when trying to add more videos',
          }),
          visibilityTime: 2000,
        });
        return;
      }

      if (index !== -1) {
        handleRemoveMedia(index);
        return;
      }

      const indexToReplace = selectedMedias.findIndex(
        selectedMedia => !selectedMedia,
      );

      if (indexToReplace >= 0) {
        const expectedDuration =
          durations?.[indexToReplace] ?? COVER_IMAGE_DEFAULT_DURATION;

        if (media.kind === 'video' && media.duration < expectedDuration) {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage(
              {
                defaultMessage: 'Selected video should be at least {duration}s',
                description:
                  'Error message when selecting a video media that is too short',
              },
              { duration: Math.ceil(expectedDuration * 10) / 10 },
            ),
          });
          return;
        }
        setSelectedMedias(prevSelectedMedias => {
          const newSelectedMedias = [...prevSelectedMedias];
          newSelectedMedias[indexToReplace] = media;
          return newSelectedMedias;
        });
      } else if (
        (!initialMedias || initialMedias.length === 0) &&
        selectedMedias.length < COVER_MAX_MEDIA
      ) {
        setSelectedMedias(prevSelectedMedias => [...prevSelectedMedias, media]);
      }
    },
    [
      durations,
      initialMedias,
      intl,
      maxSelectableVideos,
      multiSelection,
      selectedMedias,
    ],
  );

  const handleDuplicateMedia = () => {
    if (
      durations &&
      selectedMediasIds.length > 0 &&
      selectedMediasIds.length < durations.length
    ) {
      const lastSelectedIndex = selectedMediasIds.length - 1;
      const lastSelected = selectedMedias[lastSelectedIndex];

      if (lastSelected?.kind === 'video') {
        const longerDuration = durations.find(
          (duration, i) =>
            i > lastSelectedIndex && duration > lastSelected.duration,
        );

        if (longerDuration) {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage(
              {
                defaultMessage: 'Selected video should be at least {duration}s',
                description:
                  'Error message when duplicating a video media that is too short',
              },
              { duration: Math.ceil(longerDuration * 10) / 10 },
            ),
          });

          return null;
        }
      }
    }

    const missingMedia = maxMedias - selectedMediasIds.length;

    if (missingMedia > 0) {
      const selected = selectedMedias.filter(
        media => media !== null,
      ) as SourceMedia[];
      const duplicatedMedias = duplicateMediaToFillSlots(
        maxMedias,
        selected,
        maxSelectableVideos,
      );
      setSelectedMedias(duplicatedMedias);

      if (duplicatedMedias.length < maxMedias) {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Maximum number of videos reached',
            description: 'Error message when trying to add more videos',
          }),
          visibilityTime: 2000,
        });
        return null;
      }

      return duplicatedMedias;
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Maximum number of videos reached',
          description: 'Error message when trying to add more videos',
        }),
        visibilityTime: 2000,
      });
      return null;
    }
  };

  const handleOnFinished = () => {
    const validMediaCount = selectedMedias.filter(Boolean).length;
    if (validMediaCount === 0) {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: 'No media selected',
          description: 'Title of the permission picker in image picker wizard',
        }),
        intl.formatMessage({
          defaultMessage: 'Please select at least one media',
          description: 'Description of the no media selected',
        }),
      );
      return;
    }
    if (!multiSelection) {
      onFinished(selectedMedias as SourceMedia[]);
      return;
    }

    if (durationsFixed && selectedMediasIds.length < maxMedias) {
      Alert.alert(
        intl.formatMessage(
          {
            defaultMessage: `{mediaPickedNumber, plural,
              =0 {#/{totalMediaNumber} media selected}
              =1 {#/{totalMediaNumber} media selected}
              other {#/{totalMediaNumber} media selected}
            }`,
            description:
              'Title of missing media in cover edition to propose duplication',
          },
          {
            mediaPickedNumber: selectedMediasIds.length,
            totalMediaNumber: maxMedias,
          },
        ),
        intl.formatMessage({
          defaultMessage:
            'Do you want to duplicate the selected media or select more?',
          description:
            'Description of the duplicate the selected media or select more',
        }),
        [
          {
            text: intl.formatMessage({
              defaultMessage: 'Duplicate media',
              description: 'Button to duplicate media',
            }),
            onPress: () => {
              const medias = handleDuplicateMedia();
              if (medias) onFinished(medias);
            },
          },
          {
            text: intl.formatMessage({
              defaultMessage: 'Select more',
              description: 'Button to select more media',
            }),
            onPress: () => {},
            isPreferred: true,
          },
        ],
      );

      return;
    }

    onFinished(selectedMedias as SourceMedia[]);
  };

  const mediasOrSlot: Array<SourceMedia | null> = durationsFixed
    ? Array.from(
        { length: maxMedias },
        (_, index) => selectedMedias[index] ?? null,
      )
    : selectedMedias;

  const selectionLabel = durationsFixed
    ? intl.formatMessage(
        {
          defaultMessage: `{count, plural,
              =0 {#/{max} media selected}
              =1 {#/{max} media selected}
              other {#/{max} media selected}
            }`,
          description:
            'Medias selection label for fixed number multi selection of media in cover edition',
        },
        { count: selectedMediasIds.length, max: maxMedias },
      )
    : intl.formatMessage(
        {
          defaultMessage: `{count, plural,
              =0 {No media selected}
              =1 {1/{max} (max) media selected}
              other {#/{max} (max) media selected}
            }`,
          description:
            'Medias selection label for free multi selection of media in cover edition',
        },
        { count: selectedMediasIds.length, max: COVER_MAX_MEDIA },
      );

  const { top, bottom } = useScreenInsets();
  const { width: windowWidth } = useWindowDimensions();
  return (
    <>
      <Container
        {...props}
        style={[style, styles.root, { paddingBottom: bottom, paddingTop: top }]}
      >
        <View style={styles.headerSection}>
          {multiSelection ? (
            <Header
              leftElement={
                <IconButton
                  icon="arrow_down"
                  onPress={onClose}
                  iconSize={28}
                  variant="icon"
                />
              }
              middleElement={intl.formatMessage(
                {
                  defaultMessage: 'Select {totalMediaNumber} media',
                  description: 'Title of the Cover Editor Media picker',
                },
                { totalMediaNumber: maxMedias },
              )}
            />
          ) : (
            <Header
              leftElement={
                <CancelHeaderButton onPress={onClose} variant="secondary" />
              }
              rightElement={<SaveHeaderButton onPress={handleOnFinished} />}
              middleElement={intl.formatMessage({
                defaultMessage: 'Select Media',
                description:
                  'Title of the Cover Editor Media picker - Select Media',
              })}
            />
          )}
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
                    onMediaSelected={handleMediaSelected}
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
                  onMediaSelected={handleMediaSelected}
                />
              ),
            },
            {
              id: 'stock_video',
              element: (
                <StockMediaList
                  kind="video"
                  selectedMediasIds={selectedMediasIds}
                  onMediaSelected={handleMediaSelected}
                />
              ),
            },
          ]}
        />
        {multiSelection && (
          <View style={styles.bottomBar}>
            <View style={styles.selectionRow}>
              <View style={styles.labelMediaContainer}>
                <Text variant="medium" style={styles.labelMediaSelected}>
                  {selectionLabel}
                </Text>
                {maxSelectableVideos ? (
                  <Text variant="small" style={styles.labelMediaSelected}>
                    <FormattedMessage
                      defaultMessage={`{max, plural, =1 {{max} video max} other {{max} videos max}}`}
                      values={{ max: maxSelectableVideos }}
                      description="CoverEditorMediaPicker - max videos"
                    />
                  </Text>
                ) : null}
              </View>
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Done',
                  description: 'Cover Editor Media Picker - Done button',
                })}
                onPress={handleOnFinished}
              />
            </View>
            {!!mediasOrSlot.length && (
              <ScrollView
                horizontal
                contentContainerStyle={styles.selectedMediasList}
                style={{ overflow: 'visible' }}
              >
                {mediasOrSlot.map((media, index) => {
                  const duration = durationsFixed
                    ? (durations?.[index] ?? null)
                    : null;
                  return (
                    <View style={styles.mediaContainer} key={index}>
                      <View style={styles.media}>
                        {media && (
                          <>
                            <View
                              style={styles.mediaPicked}
                              testID="image-picker-Media-image"
                            >
                              <Image
                                source={{
                                  uri:
                                    media?.galleryUri ??
                                    media.thumbnail ??
                                    media.uri,
                                }}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                }}
                              />
                            </View>
                            <IconButton
                              icon="close"
                              size={24}
                              onPress={() => handleRemoveMedia(index)}
                              iconStyle={styles.mediaDeleteIcon}
                              style={styles.mediaDeleteButton}
                            />
                          </>
                        )}
                        {duration != null && (
                          <View style={styles.mediaDuration}>
                            <Text variant="button" style={styles.textDuration}>
                              <FormattedMessage
                                defaultMessage="{duration}s"
                                description="CoverEditorMediaPicker - duration in seconds"
                                values={{
                                  duration: Math.round(duration * 10) / 10,
                                }}
                              />
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
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

export default CoverEditorMediaPicker;

const stylesheet = createStyleSheet(appearance => ({
  root: {
    flex: 1,
  },
  bottomBar: {
    width: '100%',
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: appearance === 'light' ? colors.grey100 : colors.grey1000,
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    justifyItems: 'center',
    gap: 10,
    marginHorizontal: 20,
  },
  selectedMediasList: {
    flexDirection: 'row',
    alignContent: 'center',
    justifyItems: 'center',
    gap: 15,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    overflow: 'visible',
  },
  labelMediaSelected: {
    color: colors.grey400,
  },
  labelMediaContainer: {
    alignSelf: 'center',
  },
  media: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    overflow: 'visible',
    ...shadow(appearance, 'center'),
  },
  mediaContainer: {
    paddingBottom: 15,
  },
  mediaDeleteIcon: {
    tintColor: appearance === 'light' ? colors.black : colors.grey100,
  },
  mediaDeleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    borderRadius: 12,
    borderColor: appearance === 'light' ? colors.grey100 : colors.grey1000,
  },
  mediaDuration: [
    {
      backgroundColor: 'rgba(14, 18, 22, 0.5)',
      borderRadius: 12,
      position: 'absolute',
      bottom: 2,
      right: 2,
      padding: 5,
      flex: 1,
    },
    shadow(appearance, 'center'),
  ],
  mediaPicked: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  textDuration: {
    color: 'white',
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
}));
