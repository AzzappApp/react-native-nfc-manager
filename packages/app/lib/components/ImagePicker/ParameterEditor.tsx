import { StyleSheet, Text, View } from 'react-native';
import { textStyles } from '../../../theme';
import DashedSlider from '../../ui/DashedSlider';
import { editionParametersSettings } from './helpers';
import type { ImageEditionParameters } from './mediaHelpers';
import type { ViewProps } from 'react-native';

type ParamEditorProps = ViewProps & {
  parameter: keyof ImageEditionParameters;
  value: number | null | undefined;
  onChange(value: number): void;
};

const ParamEditor = ({
  parameter,
  value: propsValue,
  onChange,
  style,
  ...props
}: ParamEditorProps) => {
  const parameterSettings = editionParametersSettings[parameter];
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
      <Text style={[textStyles.normal, styles.sliderValue]}>
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

export default ParamEditor;

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
