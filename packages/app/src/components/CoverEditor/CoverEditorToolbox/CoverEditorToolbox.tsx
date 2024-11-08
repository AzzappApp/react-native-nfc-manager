import { forwardRef, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import ColorTriptychRenderer from '#components/ColorTriptychRenderer';
import useBoolean from '#hooks/useBoolean';
import useToggle from '#hooks/useToggle';
import { useCoverEditorContext } from '../CoverEditorContext';
import { extractLottieInfoMemoized } from '../coverEditorHelpers';
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
import type { CoverEditorLinksToolActions } from './tools/CoverEditorLinksTool';
import type { ForwardedRef } from 'react';

const CoverEditorToolbox = (
  _: any,
  ref: ForwardedRef<CoverEditorLinksToolActions>,
) => {
  const [textModalVisible, toggleTextModalVisible] = useToggle();
  const [colorPickerVisible, showColorPicker, closeColorPicker] = useBoolean();
  const [
    showOverlayImagePicker,
    openOverlayImagePicker,
    closeOverlayImagePicker,
  ] = useBoolean(false);
  const { coverEditorState, dispatch } = useCoverEditorContext();

  const { editionMode, cardColors } = coverEditorState;

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

  let exportCover: (() => void) | undefined = undefined;
  if (process.env.DEPLOYMENT_ENVIRONMENT !== 'production') {
    exportCover = () => {
      const { linksLayer, overlayLayers, textLayers } = coverEditorState;

      const coverData = JSON.stringify({
        linksLayer,
        overlayLayers,
        textLayers,
      });

      Share.share({ message: coverData });
    };
  }

  const lottieInfo = extractLottieInfoMemoized(coverEditorState.lottie);

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
            onPress={openOverlayImagePicker}
          />
          {(!lottieInfo || lottieInfo.assetsInfos.length > 0) && (
            <ToolBoxSection
              label={intl.formatMessage({
                defaultMessage: 'Media',
                description: 'Cover Edition - Toolbox media',
              })}
              icon="add_media"
              onPress={() => setCurrentEditionMode('media')}
            />
          )}
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
            onPress={showColorPicker}
          />
          {process.env.DEPLOYMENT_ENVIRONMENT !== 'production' && (
            <ToolBoxSection
              label="Export"
              icon="settings"
              onPress={exportCover}
            />
          )}
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
        <CoverEditorLinksToolbox ref={ref} />
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
        onRequestClose={closeColorPicker}
        onCloseCanceled={showColorPicker}
      />
      <CoverEditorAddOverlay
        onClose={closeOverlayImagePicker}
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

export default forwardRef(CoverEditorToolbox);
