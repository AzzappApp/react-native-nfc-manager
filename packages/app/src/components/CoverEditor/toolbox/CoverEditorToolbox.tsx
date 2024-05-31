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
import ToolBoxSection, { TOOLBOX_SECTION_HEIGHT } from '#ui/ToolBoxSection';
import { useCoverEditorContext } from '../CoverEditorContext';
import CoverEditorLinksToolbox from './CoverEditorLinkToolbox';
import CoverEditorMediaEditToolbox from './CoverEditorMediaEditToolbox';
import CoverEditorMediaToolbox from './CoverEditorMediaToolbox';
import CoverEditorOverlayToolbox from './CoverEditorOverlayToolbox';
import CoverEditorTextToolbox from './CoverEditorTextToolbox';
import CoverEditorAddOverlay from './modals/CoverEditorAddOverlay';
import CoverEditorAddTextModal from './modals/CoverEditorAddTextModal';
import type { CoverEditorToolbox_profile$key } from '#relayArtifacts/CoverEditorToolbox_profile.graphql';
import type { TemplateTypePreview } from '../templateList/CoverEditorTemplateTypePreviews';

type CoverEditorToolboxProps = {
  profile: CoverEditorToolbox_profile$key;
  coverTemplatePreview: TemplateTypePreview | null;
};

const CoverEditorToolbox = ({
  profile: profileKey,
  coverTemplatePreview,
}: CoverEditorToolboxProps) => {
  const intl = useIntl();
  const [textModalVisible, toggleTextModalVisible] = useToggle();
  const [colorPickerVisible, toggleColorPickerVisible] = useToggle();
  const [showOverlayImagePicker, toggleOverlayImagePicker] = useToggle(false);
  const { coverEditorState, dispatch } = useCoverEditorContext();

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

  const toolboxes = useMemo(
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
          onPress: () => {
            if (coverEditorState.overlayLayer) {
              dispatch({
                type: 'SELECT_LAYER',
                payload: {
                  layerMode: 'overlay',
                  index: null,
                },
              });
            } else {
              toggleOverlayImagePicker();
            }
          },
        },
        {
          id: 'media',
          label: intl.formatMessage({
            defaultMessage: 'Media',
            description: 'Cover Edition - Toolbox media',
          }),
          icon: 'add_media',
          onPress: () => {
            dispatch({
              type: 'SELECT_LAYER',
              payload: {
                layerMode: 'media',
                index: null,
              },
            });
          },
        },
        {
          id: 'links',
          label: intl.formatMessage({
            defaultMessage: 'Links',
            description: 'Cover Edition - Toolbox links',
          }),
          icon: 'link',
          onPress: () => {
            dispatch({
              type: 'SELECT_LAYER',
              payload: {
                layerMode: 'links',
                index: null,
              },
            });
          },
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
      coverEditorState.overlayLayer,
      dispatch,
      intl,
      toggleColorPickerVisible,
      toggleOverlayImagePicker,
      toggleTextModalVisible,
    ],
  );

  const mainBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(coverEditorState.layerMode != null ? 0 : 1, {
        duration: 500,
      }),
    };
  });

  const overlayLayerStyle = useAnimatedStyle(() => {
    // translation is less consumin that resizing direclty the height and will better match upmitt recommendation
    const translation = withTiming(
      coverEditorState.layerMode === 'overlay' ? 0 : TOOLBOX_SECTION_HEIGHT,
      { duration: 500 },
    );
    return {
      transform: [{ translateY: translation }],
    };
  }, [coverEditorState.layerMode]);

  const textEditLayerStyle = useAnimatedStyle(() => {
    // translation is less consumin that resizing direclty the height and will better match upmitt recommendation
    const translation = withTiming(
      coverEditorState.layerMode === 'text' ? 0 : TOOLBOX_SECTION_HEIGHT,
      { duration: 500 },
    );
    return {
      transform: [{ translateY: translation }],
    };
  }, [coverEditorState.layerMode]);

  const linksEditLayerStyle = useAnimatedStyle(() => {
    // translation is less consumin that resizing direclty the height and will better match upmitt recommendation
    const translation = withTiming(
      coverEditorState.layerMode === 'links' ? 0 : TOOLBOX_SECTION_HEIGHT,
      { duration: 500 },
    );
    return {
      transform: [{ translateY: translation }],
    };
  }, [coverEditorState.layerMode]);

  const mediaEditLayerStyle = useAnimatedStyle(() => {
    // translation is less consumin that resizing direclty the height and will better match upmitt recommendation
    const translation = withTiming(
      coverEditorState.layerMode === 'mediaEdit' ? 0 : TOOLBOX_SECTION_HEIGHT,
      { duration: 500 },
    );
    return {
      transform: [{ translateY: translation }],
    };
  }, [coverEditorState.layerMode]);

  const mediaLayerStyle = useAnimatedStyle(() => {
    // translation is less consumin that resizing direclty the height and will better match upmitt recommendation
    const translation = withTiming(
      coverEditorState.layerMode === 'media' ||
        coverEditorState.layerMode === 'mediaEdit'
        ? 0
        : TOOLBOX_SECTION_HEIGHT,
      { duration: 500 },
    );
    return {
      transform: [{ translateY: translation }],
    };
  }, [coverEditorState.layerMode]);

  return (
    <View style={{ height: TOOLBOX_SECTION_HEIGHT, overflow: 'hidden' }}>
      <Animated.View style={mainBarAnimatedStyle}>
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
      </Animated.View>

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
        <CoverEditorMediaToolbox
          count={coverTemplatePreview?.mediaCount ?? -1}
        />
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
