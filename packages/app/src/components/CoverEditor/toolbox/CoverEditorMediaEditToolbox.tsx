import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import ToolBoxSection, { TOOLBOX_SECTION_HEIGHT } from '#ui/ToolBoxSection';
import {
  useCoverEditorContext,
  useCoverEditorMedia,
} from '../CoverEditorContext';
import CoverEditorEffectTool from '../tools/CoverEditorEffectTool';
import CoverEditorImageCropTool from '../tools/CoverEditorImageCropTool';
import CoverEditorOverlayReplace from '../tools/CoverEditorOverlayReplace';

const CoverEditorMediaEditToolbox = () => {
  const styles = useStyleSheet(styleSheet);

  const { dispatch } = useCoverEditorContext();
  const mediaInfos = useCoverEditorMedia();
  const { media } = mediaInfos ?? {};

  const onClose = () => {
    dispatch({
      type: 'SELECT_LAYER',
      payload: {
        layerMode: 'media',
        index: null,
      },
    });
  };

  return (
    <View style={styles.container}>
      <PressableOpacity style={styles.previewButton} onPress={onClose}>
        <Icon icon="arrow_down" />
        {media ? (
          <Image source={{ uri: media.uri }} style={styles.previewContent} />
        ) : (
          <View style={styles.previewContent} />
        )}
      </PressableOpacity>
      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContentContainer}
        showsHorizontalScrollIndicator={false}
      >
        {media?.kind === 'video' && (
          <ToolBoxSection icon="chrono" label="cut" onPress={console.log} />
        )}
        <CoverEditorEffectTool />
        <CoverEditorOverlayReplace />
        <CoverEditorImageCropTool />
      </ScrollView>
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
    width: 45,
    height: 45,
  },
}));

export default CoverEditorMediaEditToolbox;
