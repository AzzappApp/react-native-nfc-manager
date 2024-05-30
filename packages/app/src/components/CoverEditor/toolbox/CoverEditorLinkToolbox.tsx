import { useIntl } from 'react-intl';
import { ScrollView, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import { TOOLBOX_SECTION_HEIGHT } from '#ui/ToolBoxSection';
import { useCoverEditorContext } from '../CoverEditorContext';
import CoverEditorColorTool from '../tools/CoverEditorColorTool';
import CoverEditorDeleteTool from '../tools/CoverEditorDeleteTool';
import CoverEditorFontSizeTool from '../tools/CoverEditorFontSizeTool';
import CoverEditorLinksTool from '../tools/CoverEditorLinksTool';
import CoverEditorShadowTool from '../tools/CoverEditorShadowTool';
import type { CoverEditorColorTool_webCard$key } from '#relayArtifacts/CoverEditorColorTool_webCard.graphql';

type Props = {
  webcard: CoverEditorColorTool_webCard$key;
};

const CoverEditorLinksToolbox = ({ webcard }: Props) => {
  const styles = useStyleSheet(styleSheet);

  const intl = useIntl();
  const { dispatch } = useCoverEditorContext();

  const onClose = () => {
    dispatch({
      type: 'SELECT_LAYER',
      payload: {
        index: null,
        layerMode: null,
      },
    });
  };

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
        <CoverEditorLinksTool />
        <CoverEditorColorTool webcard={webcard} />
        <CoverEditorFontSizeTool
          title={intl.formatMessage({
            defaultMessage: 'Icon size',
            description: 'Cover Edition - Toolbox sub-menu link - Icon size',
          })}
        />
        <CoverEditorShadowTool />
        <CoverEditorDeleteTool />
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

export default CoverEditorLinksToolbox;
