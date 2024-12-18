import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import {
  SIMPLE_TEXT_MAX_FONT_SIZE,
  SIMPLE_TEXT_MAX_VERTICAL_SPACING,
  SIMPLE_TEXT_MIN_FONT_SIZE,
  SIMPLE_TITLE_MAX_FONT_SIZE,
  SIMPLE_TITLE_MAX_VERTICAL_SPACING,
  SIMPLE_TITLE_MIN_FONT_SIZE,
} from '@azzapp/shared/cardModuleHelpers';
import { WebCardColorDropDownPicker } from '#components/WebCardColorPicker';
import AlignmentButton from '#ui/AlignmentButton';
import FontDropDownPicker from '#ui/FontDropDownPicker';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { TextAlignment } from '#relayArtifacts/SimpleTextEditionScreen_module.graphql';
import type { SimpleTextStyleEditionPanel_webCard$key } from '#relayArtifacts/SimpleTextStyleEditionPanel_webCard.graphql';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type SimpleTextStyleEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the profile
   */
  webCard: SimpleTextStyleEditionPanel_webCard$key | null;
  /**
   * The color of the text
   */
  fontColor: string;
  /**
   * The font family of the text
   */
  fontFamily: string;
  /**
   * The font size of the text
   */
  fontSize: SharedValue<number>;
  /**
   * The vertical spacing of the text
   */
  bottomSheetHeight: number;
  /**
   * The vertical spacing of the text
   */
  verticalSpacing: SharedValue<number>;
  /**
   * The text alignment
   */
  textAlignment: TextAlignment;
  /**
   * The maximum allowed font size of the text
   */
  moduleKind: 'simpleText' | 'simpleTitle';
  /**
   * A callback called when the user update the font family
   */
  onFontFamilyChange: (fontFamily: string) => void;
  /**
   * A callback called when the user update the color
   */
  onColorChange: (color: string) => void;
  /**
   * A callback called when the user update the text alignment
   */
  onTextAlignmentChange: (textAlignment: TextAlignment) => void;

  onTouched?: () => void;
};

/**
 * Panel to edit the style of the simple text
 */
const SimpleTextStyleEditionPanel = ({
  webCard: webCardKey,
  fontColor,
  fontSize,
  verticalSpacing,
  fontFamily,
  textAlignment,
  bottomSheetHeight,
  onFontFamilyChange,
  onColorChange,
  onTextAlignmentChange,
  style,
  moduleKind,
  onTouched,
  ...props
}: SimpleTextStyleEditionPanelProps) => {
  const intl = useIntl();

  const webCard = useFragment(
    graphql`
      fragment SimpleTextStyleEditionPanel_webCard on WebCard {
        ...WebCardColorPicker_webCard
        cardColors {
          primary
          dark
          light
        }
      }
    `,
    webCardKey,
  );

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Configuration',
          description:
            'Title of the configuration section in simple text edition',
        })}
      />
      <View style={styles.buttonContainer}>
        <FontDropDownPicker
          fontFamily={fontFamily}
          onFontFamilyChange={onFontFamilyChange}
          bottomSheetHeight={bottomSheetHeight}
        />
        <WebCardColorDropDownPicker
          webCard={webCard ?? null}
          color={fontColor}
          onColorChange={onColorChange}
          bottomSheetHeight={bottomSheetHeight}
        />
        <AlignmentButton
          alignment={textAlignment}
          onAlignmentChange={onTextAlignmentChange}
        />
      </View>
      <LabeledDashedSlider
        label={
          <FormattedMessage
            defaultMessage="Font Size :"
            description="Font size message in cover edition"
          />
        }
        value={fontSize}
        min={
          moduleKind === 'simpleText'
            ? SIMPLE_TEXT_MIN_FONT_SIZE
            : SIMPLE_TITLE_MIN_FONT_SIZE
        }
        max={
          moduleKind === 'simpleText'
            ? SIMPLE_TEXT_MAX_FONT_SIZE
            : SIMPLE_TITLE_MAX_FONT_SIZE
        }
        step={1}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Font size',
          description: 'Label of the font size slider in cover edition',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage: 'Slide to change the font size',
          description: 'Hint of the font size slider in cover edition',
        })}
        style={styles.slider}
        onTouched={onTouched}
      />
      <LabeledDashedSlider
        label={
          <FormattedMessage
            defaultMessage="Vertical Spacing :"
            description="Vertical Spacing message in simple text edition"
          />
        }
        value={verticalSpacing}
        min={0}
        max={
          moduleKind === 'simpleText'
            ? SIMPLE_TEXT_MAX_VERTICAL_SPACING
            : SIMPLE_TITLE_MAX_VERTICAL_SPACING
        }
        step={1}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Vertical Spacing',
          description:
            'Label of the Vertical Spacing slider in simple text edition',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage: 'Slide to change the vertical spacing',
          description:
            'Hint of the vertical spacing slider in simple text edition',
        })}
        style={styles.slider}
        onTouched={onTouched}
      />
    </View>
  );
};

export default SimpleTextStyleEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    rowGap: 15,
    justifyContent: 'center',
  },
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: 15,
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
