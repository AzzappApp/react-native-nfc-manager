import { Image } from 'expo-image';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import PressableOpacity from '#ui/PressableOpacity';
import { TOOLBOX_SECTION_HEIGHT } from '#ui/ToolBoxSection';
import { CoverEditorActionType } from '../coverEditorActions';
import { useCoverEditorContext } from '../CoverEditorContext';
import CoverEditorMediaPickerFloatingTool from '../tools/CoverEditorMediaPickerFloatingTool';

type Props = {
  count: number;
};

const CoverEditorMediaToolbox = ({ count }: Props) => {
  const styles = useStyleSheet(styleSheet);

  const { setCurrentEditableItem, dispatch, cover } = useCoverEditorContext();

  const onClose = () => {
    dispatch({ type: CoverEditorActionType.SetLayerMode, payload: null });
    setCurrentEditableItem(null);
  };

  const displayedMedias = useMemo(() => {
    return Array.from(
      { length: count <= 0 ? cover.medias.length : count },
      (_, i) => {
        const { media } = cover.medias[i];

        return (
          <PressableNative
            key={`${media.uri}-${i}`}
            onPress={() => {
              dispatch({
                type: CoverEditorActionType.SelectLayer,
                payload: {
                  type: 'media',
                  index: i,
                },
              });
              dispatch({
                type: CoverEditorActionType.SetLayerMode,
                payload: 'mediaEdit',
              });
            }}
          >
            <Image
              source={{ uri: media?.galleryUri ?? media.uri }}
              style={styles.previewContent}
            />
          </PressableNative>
        );
      },
    );
  }, [count, cover.medias, dispatch, styles.previewContent]);

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
        {displayedMedias}
      </ScrollView>
      <CoverEditorMediaPickerFloatingTool count={count} />
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
    display: 'flex',
    backgroundColor: appearance === 'light' ? colors.grey600 : colors.grey400,
    borderRadius: 8,
    width: TOOLBOX_SECTION_HEIGHT,
    height: TOOLBOX_SECTION_HEIGHT,
  },
}));

export default CoverEditorMediaToolbox;
