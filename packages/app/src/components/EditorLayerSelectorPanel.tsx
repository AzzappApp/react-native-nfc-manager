import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { colors } from '#theme';
import ProfileColorPicker from '#components/ProfileColorPicker';
import StaticMediaList from '#components/StaticMediaList';
import ColorPreview from '#ui/ColorPreview';
import TabsBar from '#ui/TabsBar';
import type { ProfileColorPicker_profile$key } from '@azzapp/relay/artifacts/ProfileColorPicker_profile.graphql';
import type { StaticMediaList_staticMedias$key } from '@azzapp/relay/artifacts/StaticMediaList_staticMedias.graphql';
import type { ViewProps } from 'react-native';

export type EditorLayerSelectorPanelProps = ViewProps & {
  /**
   * Title of the panel.
   */
  title: string;
  /**
   * Profile of the current user.
   * Used to access the user's profile color palette.
   */
  profile: ProfileColorPicker_profile$key;
  /**
   * List of available medias.
   */
  medias: StaticMediaList_staticMedias$key;
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
  profile,
  medias,
  selectedMedia,
  tintColor,
  backgroundColor,
  onMediaChange,
  onColorChange,
  imageRatio,
  svgMode,
  bottomSheetHeight,
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
                  color={backgroundColor}
                  style={{ marginLeft: 5 }}
                />
              ),
            }
          : null,
        {
          tabKey: 'tintColor',
          label: tintColorLabel,
          rightElement: (
            <ColorPreview color={tintColor} style={{ marginLeft: 5 }} />
          ),
        },
      ]),
    [
      backgroundColor,
      backgroundColorLabel,
      hasBackground,
      tintColor,
      tintColorLabel,
      title,
    ],
  );
  return (
    <View {...props}>
      <TabsBar currentTab={currentTab} onTabPress={setCurrentTab} tabs={tabs} />
      <StaticMediaList
        medias={medias}
        selectedMedia={selectedMedia}
        backgroundColor={backgroundColor ?? colors.white}
        tintColor={tintColor}
        onSelectMedia={onMediaChange}
        style={styles.content}
        imageRatio={imageRatio}
        svgMode={svgMode}
        testID="cover-layer-list-background"
      />
      {profile && (
        <ProfileColorPicker
          visible={currentTab !== 'media'}
          height={bottomSheetHeight}
          profile={profile}
          title={
            currentTab === 'backgroundColor'
              ? backgroundColorLabel
              : tintColorLabel
          }
          selectedColor={
            currentTab === 'backgroundColor'
              ? backgroundColor ?? colors.white
              : tintColor
          }
          onColorChange={onCurrentColorChange}
          onRequestClose={onProfileColorPickerClose}
        />
      )}
    </View>
  );
};

export default EditorLayerSelectorPanel;

const styles = StyleSheet.create({
  content: {
    marginVertical: 15,
  },
});
