import { Image } from 'expo-image';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { View, Alert } from 'react-native';

import {
  COVER_MAX_VIDEO_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import ImagePicker from '#components/ImagePicker';
import SelectMediaStep from '#components/ImagePicker/SelectMultipleMediasStep';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';

import { duplicateMediaToFillSlots } from '#helpers/mediaHelpers';
import Button from '#ui/Button';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type {
  ImagePickerProps,
  ImagePickerResult,
} from '#components/ImagePicker/ImagePicker';
import type { Media } from '../ImagePicker/imagePickerTypes';

type Props = Omit<
  ImagePickerProps,
  | 'forceAspectRatio'
  | 'maxVideoDuration'
  | 'onFinished'
  | 'steps'
  | 'TopPanelWrapper'
> & {
  maxMediaCount: number;
  onFinished: (results: Media[]) => void;
};

const CoverEditorImagePicker = (propsaa: Props) => {
  const { maxMediaCount, onFinished, ...others } = propsaa;
  const styles = useStyleSheet(stylesheet);
  const intl = useIntl();
  const [mediasPicked, setMediasPicked] = useState<Media[]>([]);

  // @TODO: ???
  const _for_dev_compositionsDurations: number[] = Array.from(
    { length: maxMediaCount },
    () => Math.floor(Math.random() * (COVER_MAX_VIDEO_DURATION - 2 + 1)) + 2,
  );

  // remove media by index
  const handleRemoveMedia = (index: number) => {
    setMediasPicked(mediasPicked => mediasPicked.filter((_, i) => i !== index));
  };

  // @todo better define the expected type according to the evolution of the new cover
  const handleMediaSelected = (media: ImagePickerResult | Media) => {
    setMediasPicked(currentMedias => {
      if (currentMedias.length < maxMediaCount) {
        const updatedMedias = [...currentMedias, media as Media];
        return updatedMedias;
      }
      return currentMedias;
    });
  };

  const handleDuplicateMedia = () => {
    const duplicatedMedias = duplicateMediaToFillSlots(
      maxMediaCount,
      mediasPicked,
    );

    setMediasPicked(duplicatedMedias);

    return duplicatedMedias;
  };

  const handleOnFinished = () => {
    if (mediasPicked.length === 0) {
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

    if (mediasPicked.length < maxMediaCount) {
      Alert.alert(
        intl.formatMessage(
          {
            defaultMessage:
              '{mediaPickedNumber}/{totalMediaNumber} media selected',
            description:
              'Title of the permission picker in image picker wizard',
          },
          {
            mediaPickedNumber: mediasPicked.length,
            totalMediaNumber: maxMediaCount,
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

    onFinished(mediasPicked);
  };

  return (
    <>
      <ImagePicker
        forceAspectRatio={COVER_RATIO}
        maxVideoDuration={COVER_MAX_VIDEO_DURATION}
        steps={[SelectMediaStep]}
        {...others}
        onFinished={handleMediaSelected}
      />
      <View style={styles.container}>
        <View style={styles.selection}>
          <Text variant="medium" style={styles.labelMediaSelected}>
            {mediasPicked.length ?? 0}/{maxMediaCount} media selected
          </Text>
          <Button label="Done" onPress={handleOnFinished} />
        </View>
        <View style={styles.content}>
          {_for_dev_compositionsDurations.map((compositionDuration, index) => (
            <View key={index} style={styles.media}>
              {mediasPicked[index] ? (
                <>
                  <View
                    style={styles.mediaPicked}
                    testID="image-picker-media-image"
                  >
                    <Image
                      source={{
                        uri:
                          mediasPicked[index]?.galleryUri ||
                          mediasPicked[index]?.uri,
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
              ) : null}
              <View style={styles.mediaDuration}>
                <Text variant="button" style={styles.textDuration}>
                  {`${compositionDuration}s`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );
};

export default CoverEditorImagePicker;

const stylesheet = createStyleSheet(theme => ({
  container: [
    {
      backgroundColor: colors.white,
      width: '100%',
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    shadow(theme, 'top'),
  ],
  content: {
    flexDirection: 'row',
    alignContent: 'center',
    justifyItems: 'center',
    gap: 15,
    marginVertical: 20,
  },
  selection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    justifyItems: 'center',
    gap: 10,
  },
  labelMediaSelected: {
    color: colors.grey400,
    alignSelf: 'center',
  },
  media: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: theme === 'light' ? colors.grey50 : colors.grey1000,
  },
  mediaDeleteIcon: {
    tintColor: theme === 'light' ? colors.black : colors.grey100,
  },
  mediaDeleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderColor: theme === 'light' ? colors.grey100 : colors.grey1000,
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
    shadow(theme, 'center'),
  ],
  mediaPicked: { flex: 1, overflow: 'hidden', borderRadius: 12 },
  textDuration: {
    color: 'white',
  },
}));
