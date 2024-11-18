import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import {
  useCoverEditorContext,
  useCoverEditorOverlayLayer,
} from '../CoverEditorContext';
import CoverEditorAdjustTool from './tools/CoverEditorAdjustTool';
// import CoverEditorAnimationTool from './tools/CoverEditorAnimationTool';
import CoverEditorBorderTool from './tools/CoverEditorBorderTool';
import CoverEditorDelete from './tools/CoverEditorDelete';
import CoverEditorFiltersTool from './tools/CoverEditorFiltersTool';
import CoverEditorMediaReplace from './tools/CoverEditorMediaReplace';
import CoverEditorOverlayAnimationTool from './tools/CoverEditorOverlayAnimationTool';
import CoverEditorShadowTool from './tools/CoverEditorShadowTool';
import { TOOLBOX_SECTION_HEIGHT } from './ui/ToolBoxSection';

const CoverEditorOverlayToolbox = () => {
  const styles = useStyleSheet(styleSheet);

  const { dispatch } = useCoverEditorContext();
  const layer = useCoverEditorOverlayLayer();

  const onClose = () => {
    dispatch({
      type: 'SET_EDITION_MODE',
      payload: {
        editionMode: 'none',
        selectedItemIndex: null,
      },
    });
  };

  return (
    <View style={styles.container}>
      <PressableOpacity style={styles.previewButton} onPress={onClose}>
        <Icon icon="arrow_down" />
        {layer ? (
          <Image
            source={{ uri: layer.galleryUri ?? layer.thumbnail ?? layer.uri }}
            style={styles.previewContent}
          />
        ) : (
          <View style={styles.previewContent} />
        )}
      </PressableOpacity>
      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContentContainer}
      >
        <CoverEditorBorderTool />
        <CoverEditorOverlayAnimationTool />
        <CoverEditorFiltersTool />
        <CoverEditorAdjustTool />
        <CoverEditorShadowTool />
        <CoverEditorMediaReplace />
        <CoverEditorDelete />
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
    width: 99,
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

export default CoverEditorOverlayToolbox;
