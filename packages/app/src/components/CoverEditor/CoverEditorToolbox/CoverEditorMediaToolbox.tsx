import { Image } from 'expo-image';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { ScrollView, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import { useCoverEditorContext } from '../CoverEditorContext';
import { useLottieMediaDurations } from '../coverEditorHelpers';
import CoverEditorMediaPickerFloatingTool from './tools/CoverEditorMediaPickerFloatingTool';
import CoverEditorTransitionTool from './tools/CoverEditorTransitionTool';
import { TOOLBOX_SECTION_HEIGHT } from './ui/ToolBoxSection';

const CoverEditorMediaToolbox = () => {
  const styles = useStyleSheet(styleSheet);

  const {
    dispatch,
    coverEditorState: { medias, lottie },
  } = useCoverEditorContext();

  const onClose = () => {
    dispatch({
      type: 'SET_EDITION_MODE',
      payload: {
        editionMode: 'none',
        selectedItemIndex: null,
      },
    });
  };

  const durations = useLottieMediaDurations(lottie);

  const displayedMedias = useMemo(() => {
    const data = durations
      ? durations.map((duration, i) => {
          const media = medias[i] ?? null;
          return {
            media,
            duration,
            editable: media?.editable,
          };
        })
      : medias.map(media => ({
          media,
          duration:
            media.kind === 'image' ? media.duration : media.timeRange.duration,
          editable: media?.editable,
        }));

    return data.map(({ media, duration, editable }, index) => {
      if (!editable) return undefined;
      if (!media) {
        return (
          <View key={index} style={styles.previewContent}>
            <View style={styles.duration}>
              <Text variant="xsmall">
                {' '}
                <FormattedMessage
                  defaultMessage="{duration}s"
                  description="CoverEditorMediaToolbox - duration in seconds"
                  values={{ duration }}
                />
              </Text>
            </View>
          </View>
        );
      }

      const { galleryUri, uri, thumbnail } = media;

      return (
        <PressableNative
          key={`${media.id}-${index}`}
          onPress={() => {
            dispatch({
              type: 'SET_EDITION_MODE',
              payload: {
                editionMode: 'mediaEdit',
                selectedItemIndex: index,
              },
            });
          }}
        >
          <Image
            source={{ uri: galleryUri ?? thumbnail ?? uri }}
            style={styles.previewContent}
          />
          <View style={styles.duration}>
            <Text variant="xsmall">
              <FormattedMessage
                defaultMessage="{duration}s"
                description="CoverEditorMediaToolbox - duration in seconds"
                values={{ duration: Math.round(duration * 10) / 10 }}
              />
            </Text>
          </View>
        </PressableNative>
      );
    });
  }, [medias, dispatch, durations, styles.duration, styles.previewContent]);

  return (
    <View style={styles.container}>
      <PressableOpacity style={styles.previewButton} onPress={onClose}>
        <Icon icon="arrow_down" />
      </PressableOpacity>
      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContentContainer}
        showsHorizontalScrollIndicator={false}
      >
        {medias.length > 1 && !lottie && <CoverEditorTransitionTool />}
        {displayedMedias}
      </ScrollView>
      <CoverEditorMediaPickerFloatingTool
        durations={durations}
        durationsFixed={!!lottie}
      />
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  container: {
    height: TOOLBOX_SECTION_HEIGHT,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    marginLeft: 10,
    position: 'relative',
  },
  scrollContentContainer: {
    gap: 5,
    height: TOOLBOX_SECTION_HEIGHT,
    paddingLeft: 5,
    paddingRight: 20,
  },
  previewButton: {
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    alignItems: 'center',
    marginRight: 5,
    rowGap: 1,
    flexShrink: 0,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
    borderRadius: 10,
    height: TOOLBOX_SECTION_HEIGHT,
  },
  previewContent: {
    position: 'relative',
    display: 'flex',
    backgroundColor: appearance === 'light' ? colors.grey600 : colors.grey400,
    borderRadius: 8,
    width: TOOLBOX_SECTION_HEIGHT,
    height: TOOLBOX_SECTION_HEIGHT,
  },
  duration: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    borderRadius: 14,
    position: 'absolute',
    bottom: 5,
    right: 5,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  previewPressable: {
    position: 'relative',
  },
}));

export default CoverEditorMediaToolbox;
