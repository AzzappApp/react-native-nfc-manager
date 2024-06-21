import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { ScrollView, StyleSheet, View } from 'react-native';
import ColorTriptychRenderer from '#components/ColorTriptychRenderer';
import useToggle from '#hooks/useToggle';
import { useCoverEditorContext } from '../CoverEditorContext';
import CoverEditorLinksToolbox from './CoverEditorLinkToolbox';
import CoverEditorMediaEditToolbox from './CoverEditorMediaEditToolbox';
import CoverEditorMediaToolbox from './CoverEditorMediaToolbox';
import CoverEditorOverlayToolbox from './CoverEditorOverlayToolbox';
import CoverEditorTextToolbox from './CoverEditorTextToolbox';
import CoverEditorAddOverlay from './modals/CoverEditorAddOverlay';
import CoverEditorAddTextModal from './modals/CoverEditorAddTextModal';
import CoverEditorColorsManager from './tools/CoverEditorColorsManager';
import ToolBarContainer from './ui/ToolBarTransitioner';
import ToolBoxSection, { TOOLBOX_SECTION_HEIGHT } from './ui/ToolBoxSection';
import type { CoverEditionMode } from '../coverEditorTypes';

const CoverEditorToolbox = () => {
  const [textModalVisible, toggleTextModalVisible] = useToggle();
  const [colorPickerVisible, toggleColorPickerVisible] = useToggle();
  const [showOverlayImagePicker, toggleOverlayImagePicker] = useToggle(false);
  const {
    coverEditorState: { editionMode, cardColors },
    dispatch,
  } = useCoverEditorContext();

  const setCurrentEditionMode = useCallback(
    (mode: CoverEditionMode) => {
      dispatch({
        type: 'SET_EDITION_MODE',
        payload: {
          editionMode: mode,
          selectedItemIndex: null,
        },
      });
    },
    [dispatch],
  );

  const intl = useIntl();

  return (
    <View style={{ height: TOOLBOX_SECTION_HEIGHT, overflow: 'hidden' }}>
      <ToolBarContainer visible={editionMode === 'none'}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.scrollContentContainer}
          showsHorizontalScrollIndicator={false}
        >
          <ToolBoxSection
            label={intl.formatMessage({
              defaultMessage: 'Text',
              description: 'Cover Edition - Toolbox text',
            })}
            icon="bloc_text"
            onPress={toggleTextModalVisible}
          />
          <ToolBoxSection
            label={intl.formatMessage({
              defaultMessage: 'Overlay',
              description: 'Cover Edition - Toolbox overlay',
            })}
            icon="overlay"
            onPress={toggleOverlayImagePicker}
          />
          <ToolBoxSection
            label={intl.formatMessage({
              defaultMessage: 'Media',
              description: 'Cover Edition - Toolbox media',
            })}
            icon="add_media"
            onPress={() => setCurrentEditionMode('media')}
          />
          <ToolBoxSection
            label={intl.formatMessage({
              defaultMessage: 'Links',
              description: 'Cover Edition - Toolbox links',
            })}
            icon="link"
            onPress={() => setCurrentEditionMode('links')}
          />
          <ToolBoxSection
            label={intl.formatMessage({
              defaultMessage: 'Colors',
              description: 'Cover Edition - Toolbox colors',
            })}
            icon={
              <View style={styles.colors}>
                <ColorTriptychRenderer {...cardColors} width={16} height={16} />
              </View>
            }
            onPress={toggleColorPickerVisible}
          />
        </ScrollView>
      </ToolBarContainer>

      <ToolBarContainer destroyOnHide visible={editionMode === 'overlay'}>
        <CoverEditorOverlayToolbox />
      </ToolBarContainer>

      <ToolBarContainer
        destroyOnHide
        visible={editionMode === 'text' || editionMode === 'textEdit'}
      >
        <CoverEditorTextToolbox />
      </ToolBarContainer>

      <ToolBarContainer destroyOnHide visible={editionMode === 'links'}>
        <CoverEditorLinksToolbox />
      </ToolBarContainer>

      <ToolBarContainer destroyOnHide visible={editionMode === 'media'}>
        <CoverEditorMediaToolbox />
      </ToolBarContainer>

      <ToolBarContainer destroyOnHide visible={editionMode === 'mediaEdit'}>
        <CoverEditorMediaEditToolbox />
      </ToolBarContainer>

      <CoverEditorAddTextModal
        onClose={toggleTextModalVisible}
        open={textModalVisible}
      />
      <CoverEditorColorsManager
        visible={colorPickerVisible}
        onRequestClose={toggleColorPickerVisible}
      />
      <CoverEditorAddOverlay
        onClose={toggleOverlayImagePicker}
        open={showOverlayImagePicker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContentContainer: {
    gap: 5,
    height: TOOLBOX_SECTION_HEIGHT,
    paddingLeft: 10,
  },
  colors: {
    borderRadius: 24,
    borderStyle: 'solid',
    borderWidth: 2,
    padding: 2,
  },
});

export default CoverEditorToolbox;
