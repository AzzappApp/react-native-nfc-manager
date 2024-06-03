import { Image } from 'expo-image';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { ScrollView, View } from 'react-native';
import { extractMediasDuration } from '@azzapp/shared/lottieHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import { TOOLBOX_SECTION_HEIGHT } from '#ui/ToolBoxSection';
import { useCoverEditorContext } from '../CoverEditorContext';
import CoverEditorMediaPickerFloatingTool from '../tools/CoverEditorMediaPickerFloatingTool';
import CoverEditorTransitionTool from '../tools/CoverEditorTransitionTool';

type Props = {
  lottie: Record<string, any>;
};

const CoverEditorMediaToolbox = ({ lottie }: Props) => {
  const styles = useStyleSheet(styleSheet);

  const { dispatch, coverEditorState } = useCoverEditorContext();

  const onClose = () => {
    dispatch({
      type: 'SELECT_LAYER',
      payload: {
        layerMode: null,
        index: null,
      },
    });
  };

  const durations = useMemo(() => {
    return extractMediasDuration(lottie).map(duration => Math.round(duration));
  }, [lottie]);

  const displayedMedias = useMemo(() => {
    return durations.map((duration, i) => {
      const media = coverEditorState.medias[i];

      if (!media) {
        return (
          <View key={i} style={styles.previewContent}>
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

      return (
        <PressableNative
          key={`${media.media.uri}-${i}`}
          onPress={() => {
            dispatch({
              type: 'SELECT_LAYER',
              payload: {
                layerMode: 'mediaEdit',
                index: i,
              },
            });
          }}
          style={styles.previewPressable}
        >
          <Image
            source={{ uri: media?.media.galleryUri ?? media?.media.uri }}
            style={styles.previewContent}
          />
          <View style={styles.duration}>
            <Text variant="xsmall">
              <FormattedMessage
                defaultMessage="{duration}s"
                description="CoverEditorMediaToolbox - duration in seconds"
                values={{ duration }}
              />
            </Text>
          </View>
        </PressableNative>
      );
    });
  }, [
    coverEditorState.medias,
    dispatch,
    durations,
    styles.duration,
    styles.previewContent,
    styles.previewPressable,
  ]);

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
        {coverEditorState.medias.length > 1 && <CoverEditorTransitionTool />}
        {displayedMedias}
      </ScrollView>
      <CoverEditorMediaPickerFloatingTool durations={durations} />
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
    backgroundColor: colors.white,
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
