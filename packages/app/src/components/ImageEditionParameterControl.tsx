import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
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
  /**
   * The label suffix to display after the value.
   */
  labelSuffix?: string;
  /**
   * The label to display before the value.
   */
  label?: string;
};

function lerp(min: number, max: number, value: number) {
  'worklet';
  return min * (1 - value) + max * value;
}

function clamp(value: number, min = 0, max = 1) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

function invlerp(min: number, max: number, value: number) {
  'worklet';
  return clamp((value - min) / (max - min));
}

export function range(
  baseMin: number,
  baseMax: number,
  rangeMin: number,
  rangeMax: number,
  value: number,
) {
  'worklet';
  return lerp(rangeMin, rangeMax, invlerp(baseMin, baseMax, value));
}

/**
 * Controls the values of a single parameter of the ImageEditionParameters using a slider.
 * the limits of the parameter and the step are defined in the editionParametersSettings.
 */
const ImageEditionParameterControl = ({
  parameter,
  value: propsValue,
  onChange,
  style,
  labelSuffix,
  label,
  ...props
}: ImageEditionParameterControlProps) => {
  const parameterSettings = parameter && editionParametersSettings[parameter];

  const formatValue = useCallback(
    (value: number) => {
      'worklet';
      let displayedValue = 0;
      if (parameterSettings) {
        const { min, max, displayedValues } = parameterSettings;
        if (displayedValues) {
          displayedValue = Math.round(
            range(min, max, displayedValues[0], displayedValues[1], value),
          );
        } else if (min < 0) {
          displayedValue =
            value >= 0
              ? Math.round((value * 100) / max)
              : Math.round((-value * 100) / min);
        } else {
          displayedValue = Math.round(((value - min) * 100) / (max - min));
        }
      }
      return labelSuffix ? `${displayedValue}${labelSuffix}` : displayedValue;
    },
    [labelSuffix, parameterSettings],
  );

  if (!parameterSettings) {
    return null;
  }
  const { min, max, step, interval, defaultValue } = parameterSettings;
  const value = propsValue ?? defaultValue;

  return (
    <View style={[styles.root, style]} {...props}>
      <LabeledDashedSlider
        formatValue={formatValue}
        initialValue={value}
        min={min}
        max={max}
        step={step}
        interval={interval}
        onChange={onChange}
        label={label}
      />
    </View>
  );
};

export default ImageEditionParameterControl;

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center',
    marginBottom: 25,
    marginLeft: 20,
    marginRight: 20,
  },
  sliderValue: {
    marginBottom: 0,
    alignSelf: 'center',
    height: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: '10%',
  },
});
