import { useState, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import {
  BLOCK_TEXT_MAX_FONT_SIZE,
  BLOCK_TEXT_MAX_VERTICAL_SPACING,
  BLOCK_TEXT_MIN_FONT_SIZE,
} from '@azzapp/shared/cardModuleHelpers';
import WebCardColorPicker, {
  WebCardColorDropDownPicker,
} from '#components/WebCardColorPicker';
import AlignmentButton from '#ui/AlignmentButton';
import FontDropDownPicker from '#ui/FontDropDownPicker';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { BlockTextSettingsEditionPanel_webCard$key } from '#relayArtifacts/BlockTextSettingsEditionPanel_webCard.graphql';
import type { TextAlignment } from '#relayArtifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type BlockTextSettingsEditionPanelProps = ViewProps & {
  webCard: BlockTextSettingsEditionPanel_webCard$key | null;
  /**
   * The fontFamily currently set on the module
   */
  fontFamily: string;
  /**
   * A callback called when the user update the fontFamily
   */
  onFontFamilyChange: (fontFamily: string) => void;
  /**
   * The fontColor currently set on the module
   */
  fontColor: string;
  /**
   * A callback called when the user update the fontColor
   */
  onFontColorChange: (fontColor: string) => void;
  /**
   * The textAlign currently set on the module
   */
  textAlign: TextAlignment;
  /**
   * A callback called when the user update the textAlign
   */
  onTextAlignChange: (textAlign: TextAlignment) => void;
  /**
   * The fontSize currently set on the module
   */
  fontSize: SharedValue<number>;
  /**
   * The verticalSpacing currently set on the module
   */
  verticalSpacing: SharedValue<number>;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;

  onTouched: () => void;
};

/**
 * A Panel to edit the Settings of the BlockText edition screen
 */
const BlockTextSettingsEditionPanel = ({
  webCard: webCardKey,
  fontFamily,
  onFontFamilyChange,
  fontColor,
  onFontColorChange,
  textAlign,
  onTextAlignChange,
  fontSize,
  verticalSpacing,
  style,
  bottomSheetHeight,
  onTouched,
  ...props
}: BlockTextSettingsEditionPanelProps) => {
  const intl = useIntl();

  const [currentTab, setCurrentTab] = useState<string>('settings');

  const webCard = useFragment(
    graphql`
      fragment BlockTextSettingsEditionPanel_webCard on WebCard {
        ...WebCardColorPicker_webCard
      }
    `,
    webCardKey,
  );

  const onProfileColorPickerClose = useCallback(() => {
    setCurrentTab('settings');
  }, [setCurrentTab]);

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Configuration',
          description: 'Configuration tab label in BlockText edition',
        })}
      />
      <View style={styles.paramContainer}>
        <View style={styles.buttonContainer}>
          <FontDropDownPicker
            fontFamily={fontFamily}
            onFontFamilyChange={onFontFamilyChange}
            bottomSheetHeight={bottomSheetHeight}
          />
          <WebCardColorDropDownPicker
            webCard={webCard ?? null}
            color={fontColor}
            onColorChange={onFontColorChange}
            bottomSheetHeight={bottomSheetHeight}
          />
          <AlignmentButton
            alignment={textAlign}
            onAlignmentChange={onTextAlignChange}
          />
        </View>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Font Size :"
              description="fontSize message in BlockText edition"
            />
          }
          value={fontSize}
          min={BLOCK_TEXT_MIN_FONT_SIZE}
          max={BLOCK_TEXT_MAX_FONT_SIZE}
          step={1}
          onTouched={onTouched}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'FontSize',
            description: 'Label of the fontSize slider in BlockText edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the fontSize',
            description: 'Hint of the fontSize slider in BlockText edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Vertical Space :"
              description="vertical Spacing message in BlockText edition"
            />
          }
          value={verticalSpacing}
          min={0}
          max={BLOCK_TEXT_MAX_VERTICAL_SPACING}
          step={1}
          onTouched={onTouched}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Vertical Spacing',
            description:
              'Label of the verticalSpacing slider in BlockText edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the vertical Spacing',
            description:
              'Hint of the vertical Spacing slider in BlockText edition',
          })}
          style={styles.slider}
        />
      </View>
      {webCard && (
        <WebCardColorPicker
          visible={currentTab !== 'settings'}
          height={bottomSheetHeight}
          webCard={webCard}
          title={intl.formatMessage({
            defaultMessage: ' color',
            description: ' color title in BlockText edition',
          })}
          selectedColor={fontColor}
          onColorChange={onFontColorChange}
          onRequestClose={onProfileColorPickerClose}
        />
      )}
    </View>
  );
};

export default BlockTextSettingsEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: 15,
  },
  paramContainer: {
    width: '100%',
    flex: 1,
    paddingBottom: 25,
    rowGap: 25,
    justifyContent: 'center',
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
