import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import {
  COVER_IMAGE_DEFAULT_DURATION,
  COVER_MAX_MEDIA,
} from '@azzapp/shared/coverHelpers';
import { isDefined } from '@azzapp/shared/isDefined';
import { colors, shadow } from '#theme';
import {
  CancelHeaderButton,
  SaveHeaderButton,
} from '#components/commonsButtons';
import MediaPicker from '#components/MediaPicker';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { usePermissionContext } from '#helpers/PermissionContext';
import useMediaLimitedSelectionAlert from '#hooks/useMediaLimitedSelectionAlert';
import Button from '#ui/Button';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import { duplicateMediaToFillSlots } from '../CoverEditor/coverEditorHelpers';
import type { SourceMedia } from '#helpers/mediaHelpers';
import type { ViewProps } from 'react-native';

type MediaPickerProps = Omit<ViewProps, 'children'> & {
  /**
   * Array of durations for each media
   *
   */
  durations: number[] | null;
  /**
   * If the durations are fixed, the user will be able to select the number of media
   *
   */
  durationsFixed?: boolean;
  /**
   * Initial medias to be displayed in the media picker
   */
  initialMedias: Array<SourceMedia | null> | null;
  /**
   * Callback when the user has finished selecting the media
   *
   */
  onFinished: (results: SourceMedia[]) => void;
  /**
   * Maximum number of media that can be selected
   *
   */
  maxSelectableVideos?: number;
  /**
    Callback when the user closes the media picker
   *
   */
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
  /**
   * Maximum number of media that can be selected
   *
   */
  maxMedia?: number;
};

const CoverEditorMediaPicker = ({
  durations: initialDurationsUnfiltered,
  durationsFixed,
  initialMedias: initialMediaUnfiltered,
  onFinished,
  style,
  maxMedia,
  maxSelectableVideos,
  onClose,
  multiSelection = true,
  allowVideo = true,
  ...props
}: MediaPickerProps) => {
  const [selectedMedias, setSelectedMedias] = useState<
    Array<SourceMedia | null>
  >(
    initialMediaUnfiltered?.filter(
      media => !media || ('editable' in media && media.editable),
    ) ?? [],
  );

  const durations = useMemo(() => {
    return initialDurationsUnfiltered?.filter((_d, idx) => {
      const media = initialMediaUnfiltered?.[idx];
      return !media || ('editable' in media && media.editable);
    });
  }, [initialDurationsUnfiltered, initialMediaUnfiltered]);

  const { mediaPermission } = usePermissionContext();
  useMediaLimitedSelectionAlert(mediaPermission);

  const intl = useIntl();
  const styles = useStyleSheet(stylesheet);

  const maxMedias = !multiSelection
    ? 1
    : durationsFixed && durations
      ? durations.length
      : COVER_MAX_MEDIA;

  // remove Media by index
  const handleRemoveMedia = (index: number) => {
    setSelectedMedias(prevSelectedMedias => [
      ...prevSelectedMedias.slice(0, index),
      null,
      ...prevSelectedMedias.slice(index + 1, prevSelectedMedias.length),
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
        (!selectedMedias || selectedMedias.length === 0) &&
        selectedMedias.length < COVER_MAX_MEDIA
      ) {
        const idx = selectedMedias.findIndex(media => media === null);
        setSelectedMedias(prevSelectedMedias => {
          const newSelectedMedias = [...prevSelectedMedias];
          newSelectedMedias[idx] = media;
          return newSelectedMedias;
        });
      }
    },
    [durations, selectedMedias, intl, maxSelectableVideos, multiSelection],
  );

  const handleDuplicateMedia = useCallback(() => {
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

    const missingMedia = selectedMedias.filter(m => m === null).length;

    if (missingMedia > 0) {
      const duplicatedMedias = duplicateMediaToFillSlots(
        selectedMedias,
        maxSelectableVideos,
      );
      setSelectedMedias(duplicatedMedias);

      if (duplicatedMedias.findIndex(m => m === null) !== -1) {
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

      return duplicatedMedias.filter(isDefined);
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
  }, [
    durations,
    intl,
    maxSelectableVideos,
    selectedMedias,
    selectedMediasIds.length,
  ]);

  /** Helper funcrtion to re add uneditable media to the result */
  const mapResultWithNonEditable = (inputMedia: Array<SourceMedia | null>) => {
    let selectedMediaIdx = 0;

    return initialMediaUnfiltered?.map(media => {
      if (!media || ('editable' in media && media.editable)) {
        return inputMedia[selectedMediaIdx++];
      } else {
        return media;
      }
    });
  };

  const handleOnFinished = () => {
    // rebuild result data
    const resultMedia = multiSelection
      ? mapResultWithNonEditable(selectedMedias)
      : selectedMedias;

    if (selectedMedias.length === 0) {
      onFinished(initialMediaUnfiltered?.filter(isDefined) || []);
      return;
    }
    const resultMediaId =
      resultMedia
        ?.filter(selectedMedia => !!selectedMedia)
        .map(media => media.id) ?? [];

    const validMediaCount = selectedMedias?.filter(Boolean).length;
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
      onFinished(resultMedia?.filter(isDefined) || []);
      return;
    }

    if (durationsFixed && resultMediaId.length < maxMedias) {
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
            mediaPickedNumber: selectedMedias.filter(m => m !== null).length,
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
              if (medias) {
                const resultMedia = mapResultWithNonEditable(medias);
                if (resultMedia) onFinished(resultMedia.filter(isDefined));
              }
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
    onFinished(resultMedia?.filter(isDefined) || []);
  };

  useEffect(() => {
    if (multiSelection && selectedMedias.length === 0) {
      // no editable media, let's finish now
      handleOnFinished();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFinished, selectedMedias.length]);

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

  return (
    <MediaPicker
      {...props}
      onClose={onClose}
      onMediaSelected={handleMediaSelected}
      selectedMediasIds={selectedMediasIds}
      allowVideo={allowVideo}
      Header={
        multiSelection ? (
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
        )
      }
      BottomPanel={
        multiSelection ? (
          <View style={styles.bottomBar}>
            <View style={styles.selectionRow}>
              <View style={styles.labelMediaContainer}>
                <Text variant="medium" style={styles.labelMediaSelected}>
                  {selectionLabel}
                </Text>
                {maxSelectableVideos ? (
                  <Text variant="small" style={styles.labelMediaSelected}>
                    <FormattedMessage
                      defaultMessage={`{max, plural, =1 {{max} video max} other {git push {max} videos max}}`}
                      values={{ max: maxSelectableVideos }}
                      description="MediaPicker - max videos"
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
                              {media.kind === 'image' ||
                              media.galleryUri ||
                              media.thumbnail ? (
                                <Image
                                  source={{
                                    uri:
                                      media?.galleryUri ??
                                      media.thumbnail ??
                                      media.uri,
                                  }}
                                  style={styles.image}
                                />
                              ) : (
                                <Video
                                  source={{ uri: media.uri }}
                                  style={styles.image}
                                  resizeMode={ResizeMode.COVER}
                                />
                              )}
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
                                description="MediaPicker - duration in seconds"
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
        ) : null
      }
    />
  );
};

export default CoverEditorMediaPicker;

const stylesheet = createStyleSheet(appearance => ({
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
  arrowIcon: {
    width: 12,
    marginTop: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
}));
