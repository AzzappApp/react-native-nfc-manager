import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { colors, shadow } from '#theme';
import { SaveHeaderButton } from '#components/commonsButtons';
import MediaPicker from '#components/MediaPicker';
import { ScreenModal, preventModalDismiss } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  copyCoverMediaToCacheDir,
  MODULES_CACHE_DIR,
  type SourceMedia,
} from '#helpers/mediaHelpers';
import Button from '#ui/Button';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import UploadProgressModal from '#ui/UploadProgressModal';
import {
  CARD_MEDIA_VIDEO_DEFAULT_DURATION,
  type CardModuleMedia,
} from '../cardModuleEditorType';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type CardModuleMediaPickerProps = Omit<ViewProps, 'children'> & {
  initialMedias: CardModuleMedia[] | null;
  onFinished: (results: CardModuleMedia[]) => void;
  maxVideo?: number;
  onClose: () => void;
  /**
   * allow video selection
   *
   * @type {boolean}
   */
  allowVideo?: boolean;
  maxMedia: number;
};

const CardModuleMediaPicker = ({
  initialMedias,
  onFinished,
  style,
  maxMedia = 1,
  maxVideo,
  onClose,
  allowVideo = true,
  ...props
}: CardModuleMediaPickerProps) => {
  const intl = useIntl();
  const styles = useStyleSheet(stylesheet);
  const [selectedMedias, setSelectedMedias] = useState<CardModuleMedia[]>(
    initialMedias ?? [],
  );

  const selectedMediasIds = useMemo(
    () =>
      selectedMedias
        ?.filter(selectedMedia => !!selectedMedia)
        .map(moduleMedia => moduleMedia.media.id) ?? [],
    [selectedMedias],
  );

  // remove Media by index
  const handleRemoveMedia = (index: number) => {
    setSelectedMedias(mediasPicked =>
      mediasPicked.filter((_, i) => i !== index),
    );
  };

  // @todo better define the expected type according to the evolution of the new cover
  const handleMediaSelected = useCallback(
    (media: SourceMedia) => {
      const index = selectedMedias.findIndex(
        value => value && value.media.id === media.id,
      );
      //do not show the toast in case of replacing a media
      if (index >= 0 && selectedMedias.length >= maxMedia) {
        //show a tost message
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Maximum number of media reached',
            description: 'Error message when trying to add more media',
          }),
          visibilityTime: 2000,
        });
      }
      const disableVideoSelection = maxVideo
        ? maxVideo -
            (selectedMedias?.filter(m => m.media.kind === 'video').length ??
              0) ===
          0
        : false;

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

      let mediaModule: CardModuleMedia;
      if (media.kind === 'video') {
        mediaModule = {
          media: {
            ...media,
            filter: null,
            editionParameters: null,
            timeRange: {
              startTime: 0,
              duration: Math.min(
                CARD_MEDIA_VIDEO_DEFAULT_DURATION,
                media.duration,
              ),
            },
          },
        };
      } else {
        mediaModule = {
          media: { ...media, filter: null, editionParameters: null },
        };
      }
      if (maxMedia <= 1) {
        setSelectedMedias([mediaModule]);
        return;
      }
      if (selectedMedias.length < maxMedia) {
        setSelectedMedias([...selectedMedias, mediaModule]);
      }
    },
    [intl, maxMedia, maxVideo, selectedMedias],
  );

  const [downloading, setDownloading] = useState(false);
  const handleOnFinished = async () => {
    if (selectedMedias.length === 0) {
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

    //download video from pexel
    try {
      setDownloading(true);
      const res = await Promise.all(
        await selectedMedias.map(async cardModuleMedia => {
          if (
            cardModuleMedia.media.uri.startsWith('https://videos.pexels.com') ||
            cardModuleMedia.media.uri.startsWith('https://images.pexels.com')
          ) {
            //only copy local cache for pexel, as we don't edit video from cloudinary
            const path = await copyCoverMediaToCacheDir(
              cardModuleMedia.media,
              MODULES_CACHE_DIR,
            );
            return {
              ...cardModuleMedia,
              media: { ...cardModuleMedia.media, uri: `file://${path}` },
            };
          } else {
            return cardModuleMedia;
          }
        }),
      );
      setDownloading(false);
      onFinished(res);
    } catch {
      setDownloading(false);
    }
  };

  return (
    <>
      <MediaPicker
        {...props}
        onClose={onClose}
        onMediaSelected={handleMediaSelected}
        selectedMediasIds={selectedMediasIds}
        allowVideo={allowVideo}
        Header={
          <Header
            leftElement={
              <IconButton
                icon="arrow_down"
                onPress={onClose}
                iconSize={28}
                variant="icon"
              />
            }
            middleElement={intl.formatMessage({
              defaultMessage: 'Select media',
              description: 'Title of the Cover Editor Media picker',
            })}
            rightElement={
              maxMedia === 1 ? (
                <SaveHeaderButton onPress={handleOnFinished} />
              ) : null
            }
          />
        }
        BottomPanel={
          maxMedia > 1 ? (
            <View style={styles.bottomBar}>
              <View style={styles.selectionRow}>
                <View style={styles.labelMediaContainer}>
                  <Text variant="medium" style={styles.labelMediaSelected}>
                    <FormattedMessage
                      defaultMessage={`{count, plural,
          =0 {No media selected}
          =1 {1/{max} (max) media selected}
          other {#/{max} (max) media selected}
        }`}
                      description={
                        'Medias selection label for free multi selection of media in cover edition'
                      }
                      values={{ count: selectedMedias.length, max: maxMedia }}
                    />
                  </Text>
                  {maxVideo ? (
                    <Text variant="small" style={styles.labelMediaSelected}>
                      <FormattedMessage
                        defaultMessage={`{max, plural, =1 {{max} video max} other {{max} videos max}}`}
                        values={{ max: maxVideo }}
                        description="CardModuleMediaPickerMediaPicker - max videos"
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
              {!!selectedMedias.length && (
                <ScrollView
                  horizontal
                  contentContainerStyle={styles.selectedMediasList}
                  style={styles.scrollViewMediaList}
                >
                  {selectedMedias.map((moduleMedia, index) => {
                    if (moduleMedia === null) {
                      return null;
                    }

                    return (
                      <View style={styles.mediaContainer} key={index}>
                        <View style={styles.media}>
                          {moduleMedia && (
                            <>
                              <View
                                style={styles.mediaPicked}
                                testID="image-picker-Media-image"
                              >
                                <Image
                                  source={{
                                    uri:
                                      moduleMedia.media.galleryUri ??
                                      moduleMedia.media.thumbnail ??
                                      moduleMedia.media.uri,
                                  }}
                                  style={styles.imageStyle}
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
      <ScreenModal
        visible={downloading}
        onRequestDismiss={preventModalDismiss}
        gestureEnabled={false}
      >
        <UploadProgressModal />
      </ScreenModal>
    </>
  );
};

export default CardModuleMediaPicker;

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
  mediaPicked: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  scrollViewMediaList: { overflow: 'visible' },
  imageStyle: {
    width: '100%',
    height: '100%',
  },
}));
