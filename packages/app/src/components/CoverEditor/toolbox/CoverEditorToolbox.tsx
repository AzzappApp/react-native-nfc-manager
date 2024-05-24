import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import useToggle from '#hooks/useToggle';
import WebCardColorPicker from '#screens/WebCardScreen/WebCardColorPicker';
import ToolBoxSection from '#ui/ToolBoxSection';
import { useCoverEditorContext } from '../CoverEditorContext';
import CoverEditorLinksToolbox from './CoverEditorLinkToolbox';
import CoverEditorOverlayToolbox from './CoverEditorOverlayToolbox';
import CoverEditorTextToolbox from './CoverEditorTextToolbox';
import { TOOLBOX_SECTION_HEIGHT } from './CoverEditorToolboxItem';
import CoverEditorAddOverlay from './modals/CoverEditorAddOverlay';
import CoverEditorAddTextModal from './modals/CoverEditorAddTextModal';
import type { CoverEditorToolbox_profile$key } from '#relayArtifacts/CoverEditorToolbox_profile.graphql';

type Props = {
  profile: CoverEditorToolbox_profile$key;
};

const CoverEditorToolbox = (props: Props) => {
  const { profile: profileKey } = props;
  const intl = useIntl();
  const [textModalVisible, toggleTextModalVisible] = useToggle();
  const [colorPickerVisible, toggleColorPickerVisible] = useToggle();
  const [showOverlayImagePicker, toggleOverlayImagePicker] = useToggle(false);
  const { cover, setCurrentEditableItem } = useCoverEditorContext();

  const profile = useFragment(
    graphql`
      fragment CoverEditorToolbox_profile on Profile {
        webCard {
          id
          cardIsPublished
          cardStyle {
            borderColor
            borderRadius
            borderWidth
            buttonColor
            buttonRadius
            fontFamily
            fontSize
            gap
            titleFontFamily
            titleFontSize
          }
          cardColors {
            primary
            light
            dark
          }
          cardModules {
            id
          }
          ...CoverEditorColorTool_webCard
          ...SimpleTextStyleEditionPanel_webCard
          ...WebCardColorPicker_webCard
        }
      }
    `,
    profileKey,
  );

  const onSelectLayerMenu = useCallback(
    (id: string | null) => {
      if (!id) setCurrentEditableItem(null);
      setCurrentEditableItem({
        type: id as 'links' | 'overlay',
      });
    },
    [setCurrentEditableItem],
  );

  const toolboxes = useMemo(
    () =>
      [
        {
          id: 'media',
          label: intl.formatMessage({
            defaultMessage: 'Medias',
            description: 'Cover Edition - Toolbox medias',
          }),
          icon: 'landscape',
          onPress: () => onSelectLayerMenu('media'),
        },
        {
          id: 'text',
          label: intl.formatMessage({
            defaultMessage: 'Text',
            description: 'Cover Edition - Toolbox text',
          }),
          icon: 'bloc_text',
          onPress: toggleTextModalVisible,
        },
        {
          id: 'overlay',
          label: intl.formatMessage({
            defaultMessage: 'Overlay',
            description: 'Cover Edition - Toolbox overlay',
          }),
          icon: 'overlay',
          // onPress: toggleOverlayImagePicker,
          onPress: () => onSelectLayerMenu('overlay'),
        },
        {
          id: 'media',
          label: intl.formatMessage({
            defaultMessage: 'Media',
            description: 'Cover Edition - Toolbox media',
          }),
          icon: 'add_media',
          onPress: () => onSelectLayerMenu('media'),
        },
        {
          id: 'links',
          label: intl.formatMessage({
            defaultMessage: 'Links',
            description: 'Cover Edition - Toolbox links',
          }),
          icon: 'link',
          onPress: () => onSelectLayerMenu('links'),
        },
        {
          id: 'colors',
          label: intl.formatMessage({
            defaultMessage: 'Colors',
            description: 'Cover Edition - Toolbox colors',
          }),
          icon: 'palette',
          onPress: toggleColorPickerVisible,
        },
      ] as const,
    [intl, onSelectLayerMenu, toggleColorPickerVisible, toggleTextModalVisible],
  );

  const overlayLayerStyle = useAnimatedStyle(() => {
    // translation is less consumin that resizing direclty the height and will better match upmitt recommendation
    const translation = withTiming(
      cover.layerMode === 'overlay' ? 0 : TOOLBOX_SECTION_HEIGHT,
      { duration: 500 },
    );
    return {
      transform: [{ translateY: translation }],
    };
  }, [cover.layerMode]);

  const textEditLayerStyle = useAnimatedStyle(() => {
    // translation is less consumin that resizing direclty the height and will better match upmitt recommendation
    const translation = withTiming(
      cover.layerMode === 'text' ? 0 : TOOLBOX_SECTION_HEIGHT,
      { duration: 500 },
    );
    return {
      transform: [{ translateY: translation }],
    };
  }, [cover.layerMode]);

  const linksEditLayerStyle = useAnimatedStyle(() => {
    // translation is less consumin that resizing direclty the height and will better match upmitt recommendation
    const translation = withTiming(
      cover.layerMode === 'links' ? 0 : TOOLBOX_SECTION_HEIGHT,
      { duration: 500 },
    );
    return {
      transform: [{ translateY: translation }],
    };
  }, [cover.layerMode]);

  return (
    <View style={{ height: TOOLBOX_SECTION_HEIGHT, overflow: 'hidden' }}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContentContainer}
        showsHorizontalScrollIndicator={false}
      >
        {toolboxes.map((toolbox, index) => {
          return (
            <ToolBoxSection
              key={`toolBoxSection_${toolbox.icon}_${index}`}
              label={toolbox.label}
              icon={toolbox.icon}
              onPress={toolbox.onPress}
            />
          );
        })}
      </ScrollView>
      <Animated.View style={[styles.layerContainer, overlayLayerStyle]}>
        <CoverEditorOverlayToolbox />
      </Animated.View>

      <Animated.View style={[styles.layerContainer, textEditLayerStyle]}>
        <CoverEditorTextToolbox webcard={profile.webCard} />
      </Animated.View>

      <Animated.View style={[styles.layerContainer, linksEditLayerStyle]}>
        <CoverEditorLinksToolbox webcard={profile.webCard} />
      </Animated.View>

      <CoverEditorAddTextModal
        onClose={toggleTextModalVisible}
        open={textModalVisible}
      />
      <WebCardColorPicker
        webCard={profile.webCard}
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
  layerContainer: {
    position: 'absolute',
    height: TOOLBOX_SECTION_HEIGHT,
    width: '100%',
  },
});

export default CoverEditorToolbox;
