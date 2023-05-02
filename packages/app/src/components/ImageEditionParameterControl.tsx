import { StyleSheet, View } from 'react-native';
import DashedSlider from '#ui/DashedSlider';
import Text from '#ui/Text';
import { editionParametersSettings } from './gpu';
import type { EditionParameters } from './gpu';
import type { ViewProps } from 'react-native';
type ImageEditionParameterControlProps = ViewProps & {
  /**
   * The parameter to control.
   */
  parameter?: keyof EditionParameters | null | undefined;
  /**
   * The value of the parameter.
   */
  value: number | null | undefined;
  /**
   * Callback called when the value of the parameter changes.x
   */
  onChange(value: number): void;
};

/**
 * Controls the values of a single parameter of the ImageEditionParameters using a slider.
 * the limits of the parameter and the step are defined in the editionParametersSettings.
 */
const ImageEditionParameterControl = ({
  parameter,
  value: propsValue,
  onChange,
  style,
  ...props
}: ImageEditionParameterControlProps) => {
  const parameterSettings = parameter && editionParametersSettings[parameter];
  if (!parameterSettings) {
    return null;
  }
  const {
    defaultValue,
    min,
    max,
    step,
    interval,
    displayOriginalValue = false,
  } = parameterSettings;

  const value = propsValue ?? defaultValue;

  let displayedValue: number;
  if (displayOriginalValue) {
    displayedValue = value;
  } else if (min < 0) {
    displayedValue =
      value >= 0
        ? Math.round((value * 100) / max)
        : Math.round((-value * 100) / min);
  } else {
    displayedValue = Math.round(((value - min) * 100) / (max - min));
  }

  return (
    <View style={[styles.root, style]} {...props}>
      <Text variant="small" style={styles.sliderValue}>
        {displayedValue}
      </Text>
      <DashedSlider
        value={value}
        min={min}
        max={max}
        step={step}
        interval={interval}
        onChange={onChange}
      />
    </View>
  );
};

export default ImageEditionParameterControl;

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center',
    marginBottom: 25,
  },
  sliderValue: {
    marginBottom: 5,
    alignSelf: 'center',
    height: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: '10%',
  },
});
