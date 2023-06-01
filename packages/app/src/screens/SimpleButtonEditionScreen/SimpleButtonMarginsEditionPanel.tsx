import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
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
  const { width: windowWidth } = useWindowDimensions();

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
            defaultMessage="Margin Top : {size}"
            description="marginTop message in SimpleButton edition"
            values={{
              size: marginTop,
            }}
          />
        }
        value={marginTop}
        min={0}
        max={50}
        step={1}
        interval={Math.floor((windowWidth - 80) / 60)}
        onChange={onMargintopChange}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Margintop',
          description: 'Label of the marginTop slider in SimpleButton edition',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage: 'Slide to change the marginTop',
          description: 'Hint of the marginTop slider in SimpleButton edition',
        })}
        style={styles.slider}
      />
      <LabeledDashedSlider
        label={
          <FormattedMessage
            defaultMessage="Margin Bottom : {size}"
            description="marginBottom message in SimpleButton edition"
            values={{
              size: marginBottom,
            }}
          />
        }
        value={marginBottom}
        min={0}
        max={50}
        step={1}
        interval={Math.floor((windowWidth - 80) / 60)}
        onChange={onMarginbottomChange}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Marginbottom',
          description:
            'Label of the marginBottom slider in SimpleButton edition',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage: 'Slide to change the marginBottom',
          description:
            'Hint of the marginBottom slider in SimpleButton edition',
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
              defaultMessage="Width : {size}"
              description="width message in SimpleButton edition"
              values={{
                size: width,
              }}
            />
          }
          value={width}
          min={50}
          max={300}
          step={1}
          interval={Math.floor((windowWidth - 80) / 60)}
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
              defaultMessage="Height : {size}"
              description="height message in SimpleButton edition"
              values={{
                size: height,
              }}
            />
          }
          value={height}
          min={10}
          max={200}
          step={1}
          interval={Math.floor((windowWidth - 80) / 60)}
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
