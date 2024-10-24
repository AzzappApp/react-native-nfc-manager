import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  SIMPLE_BUTTON_MAX_HEIGHT,
  SIMPLE_BUTTON_MAX_MARGIN_BOTTOM,
  SIMPLE_BUTTON_MAX_MARGIN_TOP,
  SIMPLE_BUTTON_MAX_WIDTH,
  SIMPLE_BUTTON_MIN_HEIGHT,
  SIMPLE_BUTTON_MIN_WIDTH,
} from '@azzapp/shared/cardModuleHelpers';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TitleWithLine from '#ui/TitleWithLine';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type SimpleButtonMarginsEditionPanelProps = ViewProps & {
  /**
   * The marginTop currently set on the module
   */
  marginTop: SharedValue<number>;
  /**
   * The marginBottom currently set on the module
   */
  marginBottom: SharedValue<number>;
  /**
   * The width currently set on the module
   */
  width: SharedValue<number>;
  /**
   * The height currently set on the module
   */
  height: SharedValue<number>;

  onTouched: () => void;
};

/**
 * A Panel to edit the Margins of the SimpleButton edition screen
 */
const SimpleButtonMarginsEditionPanel = ({
  marginTop,
  marginBottom,
  width,
  height,
  style,
  onTouched,
  ...props
}: SimpleButtonMarginsEditionPanelProps) => {
  const intl = useIntl();

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Margins',
          description: 'Title of the Margins section in SimpleButton edition',
        })}
      />
      <LabeledDashedSlider
        label={
          <FormattedMessage
            defaultMessage="Top margin :"
            description="marginTop message in SimpleButton edition"
          />
        }
        value={marginTop}
        min={0}
        max={SIMPLE_BUTTON_MAX_MARGIN_TOP}
        step={1}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Top margin',
          description: 'Label of the marginTop slider in SimpleButton edition',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage: 'Slide to change the Top margin',
          description: 'Hint of the marginTop slider in SimpleButton edition',
        })}
        style={styles.slider}
        onTouched={onTouched}
      />
      <LabeledDashedSlider
        label={
          <FormattedMessage
            defaultMessage="Bottom margin :"
            description="Bottom margin message in SimpleButton edition"
          />
        }
        value={marginBottom}
        min={0}
        max={SIMPLE_BUTTON_MAX_MARGIN_BOTTOM}
        step={1}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Bottom margin',
          description:
            'Label of the marginBottom slider in SimpleButton edition',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage: 'Slide to change the Bottom margin',
          description:
            'Hint of the marginBottom marginttom slider in SimpleButton edition',
        })}
        style={styles.slider}
        onTouched={onTouched}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          columnGap: 30,
        }}
      >
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Width :"
              description="width message in SimpleButton edition"
            />
          }
          value={width}
          min={SIMPLE_BUTTON_MIN_WIDTH}
          max={SIMPLE_BUTTON_MAX_WIDTH}
          step={1}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Width',
            description: 'Label of the width slider in SimpleButton edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the width',
            description: 'Hint of the width slider in SimpleButton edition',
          })}
          style={styles.halfSlider}
          onTouched={onTouched}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Height :"
              description="height message in SimpleButton edition"
            />
          }
          value={height}
          min={SIMPLE_BUTTON_MIN_HEIGHT}
          max={SIMPLE_BUTTON_MAX_HEIGHT}
          step={1}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Height',
            description: 'Label of the height slider in SimpleButton edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the height',
            description: 'Hint of the height slider in SimpleButton edition',
          })}
          style={styles.halfSlider}
          onTouched={onTouched}
        />
      </View>
    </View>
  );
};

export default SimpleButtonMarginsEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
  halfSlider: {
    width: '40%',
    alignSelf: 'center',
  },
});
