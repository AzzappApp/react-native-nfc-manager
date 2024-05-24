import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import useToggle from '#hooks/useToggle';
import WebCardColorPicker from '#screens/WebCardScreen/WebCardColorPicker';
import { TOOLBOX_SECTION_HEIGHT } from '#ui/ToolBoxSection';
import { useCoverEditorContext } from '../CoverEditorContext';
import CoverEditorLinksToolbox from './CoverEditorLinkToolbox';
import CoverEditorMediaEditToolbox from './CoverEditorMediaEditToolbox';
import CoverEditorMediaToolbox from './CoverEditorMediaToolbox';
import CoverEditorOverlayToolbox from './CoverEditorOverlayToolbox';
import CoverEditorTextToolbox from './CoverEditorTextToolbox';
import CoverEditorToolboxItem from './CoverEditorToolboxItem';
import CoverEditorAddOverlay from './modals/CoverEditorAddOverlay';
import CoverEditorAddTextModal from './modals/CoverEditorAddTextModal';
import type { CoverEditorToolbox_profile$key } from '#relayArtifacts/CoverEditorToolbox_profile.graphql';
import type { CoverEditorToolboxItemProps } from './CoverEditorToolboxItem';
import type { TemplateTypePreview } from '../templateList/CoverEditorTemplateTypePreviews';

type Props = {
  profile: CoverEditorToolbox_profile$key;
  coverTemplatePreview: TemplateTypePreview;
};

const CoverEditorToolbox = (props: Props) => {
  const { profile: profileKey, coverTemplatePreview } = props;
  const intl = useIntl();
  const [textModalVisible, toggleTextModalVisible] = useToggle();
  const [colorPickerVisible, toggleColorPickerVisible] = useToggle();
  const [showOverlayImagePicker, toggleOverlayImagePicker] = useToggle(false);
  const { cover } = useCoverEditorContext();

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

  const toolboxes: CoverEditorToolboxItemProps[] = useMemo(
    () =>
      [
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
          onPress: toggleOverlayImagePicker,
        },
        {
          id: 'media',
          label: intl.formatMessage({
            defaultMessage: 'Media',
            description: 'Cover Edition - Toolbox media',
          }),
          icon: 'add_media',
        },
        {
          id: 'links',
          label: intl.formatMessage({
            defaultMessage: 'Links',
            description: 'Cover Edition - Toolbox links',
          }),
          icon: 'link',
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
    [
      intl,
      toggleColorPickerVisible,
      toggleOverlayImagePicker,
      toggleTextModalVisible,
    ],
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

  const mediaEditLayerStyle = useAnimatedStyle(() => {
    // translation is less consumin that resizing direclty the height and will better match upmitt recommendation
    const translation = withTiming(
      cover.layerMode === 'mediaEdit' ? 0 : TOOLBOX_SECTION_HEIGHT,
      { duration: 500 },
    );
    return {
      transform: [{ translateY: translation }],
    };
  }, [cover.layerMode]);

  const mediaLayerStyle = useAnimatedStyle(() => {
    // translation is less consumin that resizing direclty the height and will better match upmitt recommendation
    const translation = withTiming(
      cover.layerMode === 'media' ? 0 : TOOLBOX_SECTION_HEIGHT,
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
            <CoverEditorToolboxItem
              key={`toolBoxSection_${toolbox.icon}_${index}`}
              label={toolbox.label}
              id={toolbox.id}
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

      <Animated.View style={[styles.layerContainer, mediaLayerStyle]}>
        <CoverEditorMediaToolbox count={coverTemplatePreview.mediaCount} />
      </Animated.View>

      <Animated.View style={[styles.layerContainer, mediaEditLayerStyle]}>
        <CoverEditorMediaEditToolbox />
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
