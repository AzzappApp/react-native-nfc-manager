import { useState, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';

import { useFragment, graphql } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { swapColor } from '@azzapp/shared/cardHelpers';
import ProfileColorPicker from '#components/ProfileColorPicker';
import ColorPreview from '#ui/ColorPreview';
import FloatingIconButton from '#ui/FloatingIconButton';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TabsBar from '#ui/TabsBar';
import type { CardModuleSocialLinksArrangement } from '@azzapp/relay/artifacts/SocialLinksRenderer_module.graphql';
import type { SocialLinksSettingsEditionPanel_viewer$key } from '@azzapp/relay/artifacts/SocialLinksSettingsEditionPanel_viewer.graphql';
import type { ViewProps } from 'react-native';

type SocialLinksSettingsEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the viewer
   */
  viewer: SocialLinksSettingsEditionPanel_viewer$key;
  /**
   * The iconColor currently set on the module
   */
  iconColor: string;
  /**
   * A callback called when the user update the iconColor
   */
  onIconColorChange: (iconColor: string) => void;
  /**
   * The iconSize currently set on the module
   */
  iconSize: number;
  /**
   * A callback called when the user update the iconSize
   */
  onIconSizeChange: (iconSize: number) => void;
  /**
   * The arrangement currently set on the module
   */
  arrangement: CardModuleSocialLinksArrangement;
  /**
   * A callback called when the user update the arrangement
   */
  onArrangementChange: () => void;
  /**
   * The borderWidth currently set on the module
   */
  borderWidth: number;
  /**
   * A callback called when the user update the borderWidth
   */
  onBorderWidthChange: (borderWidth: number) => void;
  /**
   * The columnGap currently set on the module
   */
  columnGap: number;
  /**
   * A callback called when the user update the columnGap
   */
  onColumnGapChange: (columnGap: number) => void;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;
};

/**
 * A Panel to edit the Settings of the SocialLinks edition screen
 */
const SocialLinksSettingsEditionPanel = ({
  viewer,
  iconColor,
  onIconColorChange,
  iconSize,
  onIconSizeChange,
  arrangement,
  onArrangementChange,
  borderWidth,
  onBorderWidthChange,
  columnGap,
  onColumnGapChange,
  style,
  bottomSheetHeight,
  ...props
}: SocialLinksSettingsEditionPanelProps) => {
  const intl = useIntl();

  const [currentTab, setCurrentTab] = useState<string>('settings');
  const { profile } = useFragment(
    graphql`
      fragment SocialLinksSettingsEditionPanel_viewer on Viewer {
        profile {
          ...ProfileColorPicker_profile
          cardColors {
            primary
            light
            dark
          }
        }
      }
    `,
    viewer,
  );

  const onProfileColorPickerClose = useCallback(() => {
    setCurrentTab('settings');
  }, [setCurrentTab]);

  const tabs = useMemo(
    () =>
      convertToNonNullArray([
        {
          tabKey: 'settings',
          label: intl.formatMessage({
            defaultMessage: 'Settings',
            description: 'Settings tab label in SocialLinks edition',
          }),
        },
        {
          tabKey: 'color',
          label: intl.formatMessage({
            defaultMessage: 'Color',
            description: 'Settings color tab label in SocialLinks edition',
          }),
          rightElement: (
            <ColorPreview
              color={swapColor(iconColor, profile?.cardColors)}
              style={{ marginLeft: 5 }}
            />
          ),
        },
      ]),
    [iconColor, intl, profile?.cardColors],
  );

  return (
    <View style={[styles.root, style]} {...props}>
      <TabsBar currentTab={currentTab} onTabPress={setCurrentTab} tabs={tabs} />
      <View style={styles.paramContainer}>
        <View style={styles.buttonContainer}>
          <FloatingIconButton
            onPress={onArrangementChange}
            accessibilityRole="button"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Text alignment',
              description: 'Label of the text alignment button',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Tap to change the text alignment of the text',
              description: 'Hint of the text alignment button',
            })}
            accessibilityValue={{
              text: arrangement,
            }}
            icon={arrangement === 'inline' ? 'scroll' : 'inline'}
            {...props}
          />
        </View>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Icon Size : {size}"
              description="Icon Size message in SocialLinks edition"
              values={{ size: iconSize }}
            />
          }
          value={iconSize}
          min={10}
          max={100}
          step={1}
          onChange={onIconSizeChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Icon Size',
            description: 'Label of the Icon Size slider in SocialLinks edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Icon Size',
            description: 'Hint of the Icon Size slider in SocialLinks edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border size : {size}"
              description="Border size message in SocialLinks edition"
              values={{
                size: borderWidth,
              }}
            />
          }
          value={borderWidth}
          min={0}
          max={10}
          step={1}
          onChange={onBorderWidthChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Border size',
            description:
              'Label of the Border size slider in SocialLinks edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Border size',
            description:
              'Hint of the Border size slider in SocialLinks edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Spacing : {size}"
              description="Spacing message in SocialLinks edition"
              values={{
                size: columnGap,
              }}
            />
          }
          value={columnGap}
          min={1}
          max={50}
          step={1}
          onChange={onColumnGapChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Spacing',
            description: 'Label of the Spacing slider in SocialLinks edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Spacing',
            description: 'Hint of the Spacing slider in SocialLinks edition',
          })}
          style={styles.slider}
        />
      </View>
      {profile && (
        <ProfileColorPicker
          visible={currentTab !== 'settings'}
          height={bottomSheetHeight}
          profile={profile}
          title={intl.formatMessage({
            defaultMessage: 'IconColor color',
            description: 'IconColor color title in SocialLinks edition',
          })}
          selectedColor={iconColor}
          onColorChange={onIconColorChange}
          onRequestClose={onProfileColorPickerClose}
        />
      )}
    </View>
  );
};

export default SocialLinksSettingsEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
  paramContainer: {
    width: '100%',
    flex: 1,
    rowGap: 15,
    justifyContent: 'center',
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: 15,
  },
});
