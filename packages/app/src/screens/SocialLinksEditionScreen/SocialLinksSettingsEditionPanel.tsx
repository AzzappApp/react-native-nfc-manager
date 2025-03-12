import { useState, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';

import { useFragment, graphql } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  SOCIAL_LINKS_MAX_BORDER_WIDTH,
  SOCIAL_LINKS_MAX_COLUMN_GAP,
  SOCIAL_LINKS_MAX_ICON_SIZE,
  SOCIAL_LINKS_MIN_ICON_SIZE,
} from '@azzapp/shared/cardModuleHelpers';
import WebCardColorPicker from '#components/WebCardColorPicker';
import ColorPreview from '#ui/ColorPreview';
import FloatingIconButton from '#ui/FloatingIconButton';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TabsBar from '#ui/TabsBar';
import type { CardModuleSocialLinksArrangement } from '#relayArtifacts/SocialLinksRenderer_module.graphql';
import type { SocialLinksSettingsEditionPanel_webCard$key } from '#relayArtifacts/SocialLinksSettingsEditionPanel_webCard.graphql';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type SocialLinksSettingsEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the webCard
   */
  webCard: SocialLinksSettingsEditionPanel_webCard$key | null;
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
  iconSize: SharedValue<number>;
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
  borderWidth: SharedValue<number>;
  /**
   * The columnGap currently set on the module
   */
  columnGap: SharedValue<number>;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;

  onTouched: () => void;
};

/**
 * A Panel to edit the Settings of the SocialLinks edition screen
 */
const SocialLinksSettingsEditionPanel = ({
  webCard: webCardKey,
  iconColor,
  onIconColorChange,
  iconSize,
  arrangement,
  onArrangementChange,
  borderWidth,
  columnGap,
  style,
  bottomSheetHeight,
  onTouched,
  ...props
}: SocialLinksSettingsEditionPanelProps) => {
  const intl = useIntl();

  const [currentTab, setCurrentTab] = useState<string>('settings');
  const webCard = useFragment(
    graphql`
      fragment SocialLinksSettingsEditionPanel_webCard on WebCard {
        ...WebCardColorPicker_webCard
        cardColors {
          primary
          light
          dark
        }
      }
    `,
    webCardKey,
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
              color={swapColor(iconColor, webCard?.cardColors)}
              style={{ marginLeft: 5 }}
            />
          ),
        },
      ]),
    [iconColor, intl, webCard?.cardColors],
  );

  return (
    <View style={[styles.root, style]} {...props}>
      <View style={styles.paramContainer}>
        <TabsBar
          currentTab={currentTab}
          onTabPress={setCurrentTab}
          tabs={tabs}
        />
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
              defaultMessage="Icon Size :"
              description="Icon Size message in SocialLinks edition"
            />
          }
          value={iconSize}
          min={SOCIAL_LINKS_MIN_ICON_SIZE}
          max={SOCIAL_LINKS_MAX_ICON_SIZE}
          step={1}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Icon Size',
            description: 'Label of the Icon Size slider in SocialLinks edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Icon Size',
            description: 'Hint of the Icon Size slider in SocialLinks edition',
          })}
          style={styles.slider}
          onTouched={onTouched}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border size :"
              description="Border size message in SocialLinks edition"
            />
          }
          value={borderWidth}
          min={0}
          max={SOCIAL_LINKS_MAX_BORDER_WIDTH}
          step={1}
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
          onTouched={onTouched}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Spacing :"
              description="Spacing message in SocialLinks edition"
            />
          }
          value={columnGap}
          min={0}
          max={SOCIAL_LINKS_MAX_COLUMN_GAP}
          step={1}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Spacing',
            description: 'Label of the Spacing slider in SocialLinks edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Spacing',
            description: 'Hint of the Spacing slider in SocialLinks edition',
          })}
          style={styles.slider}
          onTouched={onTouched}
        />
      </View>
      {webCard && (
        <WebCardColorPicker
          visible={currentTab !== 'settings'}
          height={bottomSheetHeight}
          webCard={webCard}
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
    paddingBottom: 25,
    justifyContent: 'flex-start',
  },
  paramContainer: {
    width: '100%',
    rowGap: 15,
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
