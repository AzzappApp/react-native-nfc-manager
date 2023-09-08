import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  SIMPLE_TEXT_MAX_HORIZONTAL_MARGIN,
  SIMPLE_TEXT_MAX_VERTICAL_MARGIN,
  SIMPLE_TITLE_MAX_HORIZONTAL_MARGIN,
  SIMPLE_TITLE_MAX_VERTICAL_MARGIN,
} from '@azzapp/shared/cardModuleHelpers';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type SimpleTextMarginEditionPanelProps = ViewProps & {
  /**
   * The module kind
   */
  moduleKind: 'simpleText' | 'simpleTitle';
  /**
   * The horizontal margin currently set on the module
   */
  marginHorizontal: number;
  /**
   * The vertical margin currently set on the module
   */
  marginVertical: number;
  /**
   * A callback called when the user update the horizontal margin
   */
  onMarginHorizontalChange: (marginHorizontal: number) => void;
  /**
   * A callback called when the user update the vertical margin
   */
  onMarginVerticalChange: (marginVertical: number) => void;
};

/**
 * A panel to edit the margins of the simple text module
 */
const SimpleTextMarginEditionPanel = ({
  moduleKind,
  marginHorizontal,
  marginVertical,
  onMarginVerticalChange,
  onMarginHorizontalChange,
  style,
  ...props
}: SimpleTextMarginEditionPanelProps) => {
  const intl = useIntl();

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Margins',
          description: 'Title of the margins section in simple text edition',
        })}
      />
      <View style={styles.content}>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Margin top/bottom : {size}"
              description="Font size message in cover edition"
              values={{
                size: marginVertical,
              }}
            />
          }
          value={marginVertical}
          min={0}
          max={
            moduleKind === 'simpleText'
              ? SIMPLE_TEXT_MAX_VERTICAL_MARGIN
              : SIMPLE_TITLE_MAX_VERTICAL_MARGIN
          }
          step={1}
          onChange={onMarginVerticalChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Margin size',
            description: 'Label of the margin size slider in cover edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the font size',
            description: 'Hint of the margin size slider in cover edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Margin left/right : {size}"
              description="margin size message in cover edition"
              values={{
                size: marginHorizontal,
              }}
            />
          }
          value={marginHorizontal}
          min={0}
          max={
            moduleKind === 'simpleText'
              ? SIMPLE_TEXT_MAX_HORIZONTAL_MARGIN
              : SIMPLE_TITLE_MAX_HORIZONTAL_MARGIN
          }
          step={1}
          onChange={onMarginHorizontalChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Margin size',
            description: 'Label of the margin size slider in cover edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the font size',
            description: 'Hint of the margin size slider in cover edition',
          })}
          style={styles.slider}
        />
      </View>
    </View>
  );
};

export default SimpleTextMarginEditionPanel;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  content: {
    marginTop: 20,
    flex: 1,
    justifyContent: 'center',
    rowGap: 15,
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
