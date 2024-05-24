import { useIntl } from 'react-intl';
import { ScrollView, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import { TOOLBOX_SECTION_HEIGHT } from '#ui/ToolBoxSection';
import { CoverEditorActionType } from '../coverEditorActions';
import { useCoverEditorContext } from '../CoverEditorContext';
import CoverEditorAlignmentTool from '../tools/CoverEditorAligmentTool';
import CoverEditorColorTool from '../tools/CoverEditorColorTool';
import CoverEditorDeleteTool from '../tools/CoverEditorDeleteTool';
import CoverEditorDuplicateTool from '../tools/CoverEditorDuplicateTool';
import CoverEditorFontFamilyTool from '../tools/CoverEditorFontFamilyTool';
import CoverEditorFontSizeTool from '../tools/CoverEditorFontSizeTool';
import type { CoverEditorColorTool_webCard$key } from '#relayArtifacts/CoverEditorColorTool_webCard.graphql';

type Props = {
  webcard: CoverEditorColorTool_webCard$key;
};

const CoverEditorTextToolbox = ({ webcard }: Props) => {
  const styles = useStyleSheet(styleSheet);

  const intl = useIntl();
  const { setCurrentEditableItem, dispatch } = useCoverEditorContext();

  const onClose = () => {
    dispatch({ type: CoverEditorActionType.SetLayerMode, payload: null });
    setCurrentEditableItem(null);
  };

  // const [shadow, setShadow] = useState(true);
  // const toggleShadow = () => setShadow(value => !value);

  // const textEditToolboxs = useMemo(() => {
  //   const menu: Array<{ label: string; icon: Icons; onPress?: () => void }> = [
  //     {
  //       label: intl.formatMessage({
  //         defaultMessage: 'Animate',
  //         description: 'Cover Edition - Toolbox sub-menu text - Animate',
  //       }),
  //       icon: 'animate',
  //     },
  //     {
  //       label: intl.formatMessage({
  //         defaultMessage: 'Shadow',
  //         description: 'Cover Edition - Toolbox sub-menu text - Shadow',
  //       }),
  //       onPress: toggleShadow,
  //       icon: shadow ? 'shadow_element' : 'shadow_element_off',
  //     },
  //   ];

  //   return menu;
  // }, [intl, shadow]);

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
        <CoverEditorColorTool webcard={webcard} />
        <CoverEditorFontSizeTool
          title={intl.formatMessage({
            defaultMessage: 'Font size',
            description: 'Cover Edition - Toolbox sub-menu text - Font size',
          })}
        />
        <CoverEditorFontFamilyTool />
        <CoverEditorAlignmentTool />
        <CoverEditorDuplicateTool />
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

export default CoverEditorTextToolbox;
