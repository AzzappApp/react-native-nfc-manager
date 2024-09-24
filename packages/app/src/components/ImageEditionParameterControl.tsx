import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import type { ParametersSettings } from '#helpers/mediaEditions';
import type { ViewProps } from 'react-native';
type ImageEditionParameterControlProps = ViewProps & {
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
  /**
   * The settings of the parameter.
   */
  parameterSettings?: ParametersSettings;
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
  value: propsValue,
  onChange,
  style,
  labelSuffix,
  label,
  parameterSettings,
  ...props
}: ImageEditionParameterControlProps) => {
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

  const value = propsValue ?? parameterSettings?.defaultValue ?? 0;
  const parameterValue = useSharedValue(value);

  if (!parameterSettings) {
    return null;
  }
  const { min, max, step, interval } = parameterSettings;

  return (
    <View style={[styles.root, style]} {...props}>
      <LabeledDashedSlider
        formatValue={formatValue}
        value={parameterValue}
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

export default memo(ImageEditionParameterControl);

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center',
    marginBottom: 25,
    marginLeft: 20,
    marginRight: 20,
  },
});
