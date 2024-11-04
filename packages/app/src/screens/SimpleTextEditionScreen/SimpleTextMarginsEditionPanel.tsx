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
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type SimpleTextMarginEditionPanelProps = ViewProps & {
  /**
   * The module kind
   */
  moduleKind: 'simpleText' | 'simpleTitle';
  /**
   * The horizontal margin currently set on the module
   */
  marginHorizontal: SharedValue<number>;
  /**
   * The vertical margin currently set on the module
   */
  marginVertical: SharedValue<number>;

  onTouched?: () => void;
};

/**
 * A panel to edit the margins of the simple text module
 */
const SimpleTextMarginEditionPanel = ({
  moduleKind,
  marginHorizontal,
  marginVertical,
  style,
  onTouched,
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
              defaultMessage="Margin top/bottom :"
              description="Font size message in cover edition"
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
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Margin size',
            description: 'Label of the margin size slider in cover edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the font size',
            description: 'Hint of the margin size slider in cover edition',
          })}
          style={styles.slider}
          onTouched={onTouched}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Margin left/right :"
              description="margin size message in cover edition"
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
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Margin size',
            description: 'Label of the margin size slider in cover edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the font size',
            description: 'Hint of the margin size slider in cover edition',
          })}
          style={styles.slider}
          onTouched={onTouched}
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
