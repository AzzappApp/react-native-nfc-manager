import { Image } from 'expo-image';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import {
  COVER_IMAGE_DEFAULT_DURATION,
  COVER_MAX_MEDIA,
} from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { duplicateMediaToFillSlots } from '#helpers/mediaHelpers';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import MultiMediasSelector from './MultiMediasSelector';
import type { Media } from '#helpers/mediaHelpers';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type CoverEditorMediaPickerProps = Omit<ViewProps, 'children'> & {
  durations: number[] | null;
  durationsFixed?: boolean;
  initialMedias: Media[] | null;
  onFinished: (results: Media[]) => void;
};

const CoverEditorMediaPicker = ({
  durations,
  durationsFixed,
  initialMedias,
  onFinished,
  style,
  ...props
}: CoverEditorMediaPickerProps) => {
  const [selectedMedias, setSelectedMedias] = useState<Media[]>(
    initialMedias ?? [],
  );

  const maxMedias =
    durationsFixed && durations ? durations.length : COVER_MAX_MEDIA;

  // remove media by index
  const handleRemoveMedia = (index: number) => {
    setSelectedMedias(mediasPicked =>
      mediasPicked.filter((_, i) => i !== index),
    );
  };

  // @todo better define the expected type according to the evolution of the new cover
  const handleMediaSelected = (media: Media) => {
    setSelectedMedias(currentMedias => {
      const index = currentMedias.findIndex(
        value => value.galleryUri === media.galleryUri,
      );
      if (index !== -1) {
        currentMedias = [...currentMedias];
        currentMedias.splice(index, 1);
        return currentMedias;
      }
      if (currentMedias.length < maxMedias) {
        const expectedDuration =
          durations?.[currentMedias.length] ?? COVER_IMAGE_DEFAULT_DURATION;

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
          return currentMedias;
        }

        const updatedMedias = [...currentMedias, media as Media];
        return updatedMedias;
      }
      return currentMedias;
    });
  };

  const handleDuplicateMedia = () => {
    const duplicatedMedias = duplicateMediaToFillSlots(
      maxMedias,
      selectedMedias,
    );

    setSelectedMedias(duplicatedMedias);

    return duplicatedMedias;
  };

  const intl = useIntl();
  const handleOnFinished = () => {
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

    if (durationsFixed && selectedMedias.length < maxMedias) {
      Alert.alert(
        intl.formatMessage(
          {
            defaultMessage:
              '{mediaPickedNumber}/{totalMediaNumber} medias selected',
            description:
              'Title of the permission picker in image picker wizard',
          },
          {
            mediaPickedNumber: selectedMedias.length,
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
              onFinished(medias);
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

    onFinished(selectedMedias);
  };

  const mediaOrSlot: Array<Media | null> = durationsFixed
    ? Array.from(
        { length: maxMedias },
        (_, index) => selectedMedias[index] ?? null,
      )
    : selectedMedias;
  const selectionLabel = durationsFixed
    ? intl.formatMessage(
        {
          defaultMessage: `{count}/{max} medias selected.`,
          description:
            'Medias selection label for fixed number multi selection of media in cover edition',
        },
        { count: selectedMedias.length, max: maxMedias },
      )
    : intl.formatMessage(
        {
          defaultMessage: `{count, plural,
              =0 {No media selected}
              =1 {1/{max} (max) media selected}
              other {#/{max} (max) medias selected}
            }`,
          description:
            'Medias selection label for free multi selection of media in cover edition',
        },
        { count: selectedMedias.length, max: COVER_MAX_MEDIA },
      );

  const { top, bottom } = useScreenInsets();
  const styles = useStyleSheet(stylesheet);
  return (
    <Container
      {...props}
      style={[style, styles.root, { paddingBottom: bottom, paddingTop: top }]}
    >
      <MultiMediasSelector
        selectedMedias={selectedMedias}
        onMediaSelected={handleMediaSelected}
      />
      <View style={styles.bottomBar}>
        <View style={styles.selectionRow}>
          <Text variant="medium" style={styles.labelMediaSelected}>
            {selectionLabel}
          </Text>
          <Button label="Done" onPress={handleOnFinished} />
        </View>
        {!!mediaOrSlot.length && (
          <ScrollView
            horizontal
            contentContainerStyle={styles.selectedMediasList}
          >
            {mediaOrSlot.map((media, index) => {
              const duration = durationsFixed
                ? durations?.[index] ?? null
                : null;
              return (
                <View key={index} style={styles.media}>
                  {media && (
                    <>
                      <View
                        style={styles.mediaPicked}
                        testID="image-picker-media-image"
                      >
                        <Image
                          source={{
                            uri: media?.galleryUri ?? media.uri,
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
                          values={{ duration: Math.round(duration * 10) / 10 }}
                        />
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Container>
  );
};

export default CoverEditorMediaPicker;

const stylesheet = createStyleSheet(appearance => ({
  root: {
    flex: 1,
  },
  bottomBar: {
    width: '100%',
    paddingVertical: 15,
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
    marginVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  labelMediaSelected: {
    color: colors.grey400,
    alignSelf: 'center',
  },
  media: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
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
  mediaPicked: { flex: 1, overflow: 'hidden', borderRadius: 12 },
  textDuration: {
    color: 'white',
  },
}));
