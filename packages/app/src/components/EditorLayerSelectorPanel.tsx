import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import ModuleBackgroundList from '#components/ModuleBackgroundList';
import ColorPicker from '#ui/ColorPicker';
import ColorPreview from '#ui/ColorPreview';
import TabsBar from '#ui/TabsBar';
import { useWebCardColors } from './WebCardColorPicker';
import type { ModuleBackgroundList_ModuleBackgrounds$key } from '#relayArtifacts/ModuleBackgroundList_ModuleBackgrounds.graphql';
import type { WebCardColorsBoundsComponentProps } from './WebCardColorPicker';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ViewProps } from 'react-native';

export type EditorLayerSelectorPanelProps = ViewProps & {
  /**
   * Title of the panel.
   */
  title: string;
  /**
   * Color palette of the current user.
   */
  colorPalette: ColorPalette;
  /**
   * Other user's profile colors.
   */
  colorList: string[];
  /**
   * List of available medias.
   */
  medias: ModuleBackgroundList_ModuleBackgrounds$key;
  /**
   * Currently selected media.
   */
  selectedMedia: string | null | undefined;
  /**
   * The tint color of the selected media.
   */
  tintColor: string;
  /**
   * The background color of the selected media.
   * if null, the background colors won't be editable.
   */
  backgroundColor?: string;
  /**
   * Callback called when the user selects a media.
   * @param mediaId the id of the selected media.
   */
  onMediaChange: (mediaId: string | null) => void;
  /**
   * Callback called when the user changes the tint or background color.
   *
   * @param colorName the name of the color being changed.
   * @param value the new color value.
   */
  onColorChange: (
    colorName: 'backgroundColor' | 'tintColor',
    value: string,
  ) => void;
  /**
   * Height of the bottom sheet.
   */
  bottomSheetHeight: number;
  /**
   * If true, the media will be displayed as a SVG.
   */
  svgMode?: boolean;
  /**
   * Ratio of the image.
   */
  imageRatio?: number;
  /**
   * If true, the user can edit the color palette.
   * Default to false.
   */
  canEditPalette?: boolean;
  /**
   * Called when the user update the color palette
   */
  onUpdateColorPalette: (colorPalette: ColorPalette) => void;
  /**
   * Called when the user update the color list
   */
  onUpdateColorList: (color: string[]) => void;
};

/**
 * Panel used by the different WebCard modules editor to specify the background
 * of the edited module.
 *
 * @param param0
 * @returns
 */
const EditorLayerSelectorPanel = ({
  title,
  colorPalette,
  colorList: otherColors,
  medias,
  selectedMedia,
  tintColor,
  backgroundColor,
  imageRatio,
  svgMode,
  bottomSheetHeight,
  canEditPalette = false,
  onMediaChange,
  onColorChange,
  onUpdateColorList,
  onUpdateColorPalette,
  ...props
}: EditorLayerSelectorPanelProps) => {
  const [currentTab, setCurrentTab] = useState<string>('media');

  const onCurrentColorChange = useCallback(
    (value: string) => {
      onColorChange(currentTab as 'backgroundColor' | 'tintColor', value);
    },
    [currentTab, onColorChange],
  );

  const onProfileColorPickerClose = useCallback(() => {
    setCurrentTab('media');
  }, [setCurrentTab]);

  const intl = useIntl();
  const hasBackground = !!backgroundColor;
  const tintColorLabel = hasBackground
    ? intl.formatMessage({
        defaultMessage: 'Color #2',
        description:
          'Label of the background/foreground tint color in web card modules editors',
      })
    : intl.formatMessage({
        defaultMessage: 'Color',
        description:
          'Label of the background/foreground tint color in web card modules editors when there is no background color',
      });

  const backgroundColorLabel = intl.formatMessage({
    defaultMessage: 'Color #1',
    description:
      'Label of the background/foreground background color in web card modules editors',
  });

  const tabs = useMemo(
    () =>
      convertToNonNullArray([
        {
          tabKey: 'media',
          label: title,
        },
        hasBackground
          ? {
              tabKey: 'backgroundColor',
              label: backgroundColorLabel,
              rightElement: (
                <ColorPreview
                  color={swapColor(backgroundColor, colorPalette)}
                  style={{ marginLeft: 5 }}
                />
              ),
            }
          : null,
        {
          tabKey: 'tintColor',
          label: tintColorLabel,
          rightElement: (
            <ColorPreview
              color={swapColor(tintColor, colorPalette)}
              style={{ marginLeft: 5 }}
            />
          ),
        },
      ]),
    [
      backgroundColor,
      backgroundColorLabel,
      colorPalette,
      hasBackground,
      tintColor,
      tintColorLabel,
      title,
    ],
  );

  return (
    <View {...props}>
      <TabsBar currentTab={currentTab} onTabPress={setCurrentTab} tabs={tabs} />
      <ModuleBackgroundList
        medias={medias}
        selectedMedia={selectedMedia}
        backgroundColor={swapColor(
          backgroundColor ?? colors.white,
          colorPalette,
        )}
        tintColor={swapColor(tintColor, colorPalette)}
        onSelectMedia={onMediaChange}
        style={styles.content}
        imageRatio={imageRatio}
        testID="cover-layer-list-background"
      />
      <ColorPicker
        title={
          currentTab === 'backgroundColor'
            ? backgroundColorLabel
            : tintColorLabel
        }
        selectedColor={
          currentTab === 'backgroundColor'
            ? (backgroundColor ?? colors.white)
            : tintColor
        }
        colorPalette={colorPalette}
        colorList={otherColors}
        visible={currentTab !== 'media'}
        height={bottomSheetHeight}
        canEditPalette={canEditPalette}
        onColorChange={onCurrentColorChange}
        onRequestClose={onProfileColorPickerClose}
        onUpdateColorList={onUpdateColorList}
        onUpdateColorPalette={onUpdateColorPalette}
      />
    </View>
  );
};

export default EditorLayerSelectorPanel;

const styles = StyleSheet.create({
  content: {
    marginVertical: 15,
    maxHeight: 190,
    overflow: 'visible',
  },
});

export type WebCardColorsBoundEditorLayerSelectorPanel =
  WebCardColorsBoundsComponentProps<EditorLayerSelectorPanelProps>;

/**
 * EditorLayerSelectorPanel component with the profile colors bound to the one of the current profile.
 */
export const WebCardBoundEditorLayerSelectorPanel = ({
  webCard,
  ...props
}: WebCardColorsBoundEditorLayerSelectorPanel) => {
  const webCardColorsProps = useWebCardColors(webCard);
  return <EditorLayerSelectorPanel {...webCardColorsProps} {...props} />;
};
