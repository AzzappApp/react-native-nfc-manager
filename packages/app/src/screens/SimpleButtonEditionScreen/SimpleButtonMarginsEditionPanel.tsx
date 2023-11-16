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

type SimpleButtonMarginsEditionPanelProps = ViewProps & {
  /**
   * The marginTop currently set on the module
   */
  marginTop: number;
  /**
   * A callback called when the user update the marginTop
   */
  onMargintopChange: (marginTop: number) => void;
  /**
   * The marginBottom currently set on the module
   */
  marginBottom: number;
  /**
   * A callback called when the user update the marginBottom
   */
  onMarginbottomChange: (marginBottom: number) => void;

  /**
   * The width currently set on the module
   */
  width: number;
  /**
   * A callback called when the user update the width
   */
  onWidthChange: (width: number) => void;
  /**
   * The height currently set on the module
   */
  height: number;
  /**
   * A callback called when the user update the height
   */
  onHeightChange: (height: number) => void;
};

/**
 * A Panel to edit the Margins of the SimpleButton edition screen
 */
const SimpleButtonMarginsEditionPanel = ({
  marginTop,
  onMargintopChange,
  marginBottom,
  onMarginbottomChange,
  width,
  onWidthChange,
  height,
  onHeightChange,
  style,
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
        initialValue={marginTop}
        min={0}
        max={SIMPLE_BUTTON_MAX_MARGIN_TOP}
        step={1}
        onChange={onMargintopChange}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Top margin',
          description: 'Label of the marginTop slider in SimpleButton edition',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage: 'Slide to change the Top margin',
          description: 'Hint of the marginTop slider in SimpleButton edition',
        })}
        style={styles.slider}
      />
      <LabeledDashedSlider
        label={
          <FormattedMessage
            defaultMessage="Bottom margin :"
            description="Bottom margin message in SimpleButton edition"
          />
        }
        initialValue={marginBottom}
        min={0}
        max={SIMPLE_BUTTON_MAX_MARGIN_BOTTOM}
        step={1}
        onChange={onMarginbottomChange}
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
          initialValue={width}
          min={SIMPLE_BUTTON_MIN_WIDTH}
          max={SIMPLE_BUTTON_MAX_WIDTH}
          step={1}
          onChange={onWidthChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Width',
            description: 'Label of the width slider in SimpleButton edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the width',
            description: 'Hint of the width slider in SimpleButton edition',
          })}
          style={styles.halfSlider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Height :"
              description="height message in SimpleButton edition"
            />
          }
          initialValue={height}
          min={SIMPLE_BUTTON_MIN_HEIGHT}
          max={SIMPLE_BUTTON_MAX_HEIGHT}
          step={1}
          onChange={onHeightChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Height',
            description: 'Label of the height slider in SimpleButton edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the height',
            description: 'Hint of the height slider in SimpleButton edition',
          })}
          style={styles.halfSlider}
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
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: 15,
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
