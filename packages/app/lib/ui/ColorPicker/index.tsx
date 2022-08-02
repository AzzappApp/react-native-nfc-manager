import chroma from 'chroma-js';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import BottomSheetModal from '../BottomSheetModal';
import HuePicker from './HuePicker';
import SaturationValuePicker from './SaturationValuePicker';

type ColorPickerProps = {
  title: string;
  initialValue: string;
  onChange: (value: string) => void;
  visible: boolean;
  height: number;
  onRequestClose: () => void;
};

const ColorPicker = ({
  title,
  initialValue,
  onChange,
  visible,
  onRequestClose,
  height,
}: ColorPickerProps) => {
  const [values, setValues] = useState(hexToHSV(initialValue));

  const debouncedOnChange = useDebouncedCallback(onChange, 300);

  const onSatValChange = ([saturation, val]: [number, number]) => {
    setValues(values => [values[0], saturation, val]);
    debouncedOnChange(chroma.hsv(values[0], saturation, val).hex());
  };

  const onHueChange = (hue: number) => {
    setValues(values => [hue, values[1], values[2]]);
    debouncedOnChange(chroma.hsv(hue, values[1], values[2]).hex());
  };

  const [hue, saturation, val] = values;

  return (
    <BottomSheetModal
      visible={visible}
      onRequestClose={onRequestClose}
      title={title}
      height={height}
    >
      <View style={styles.container}>
        <SaturationValuePicker
          hue={hue}
          value={[saturation, val]}
          onChange={onSatValChange}
          style={styles.saturationValuePicker}
        />
        <HuePicker
          value={hue}
          onChange={onHueChange}
          style={styles.huePicker}
        />
      </View>
    </BottomSheetModal>
  );
};

export default ColorPicker;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
  },
  saturationValuePicker: {
    height: 64,
    borderRadius: 20,
  },
  huePicker: {
    borderRadius: 4,
    marginTop: 20,
  },
});

const hexToHSV = (color: string) => {
  let [hue, saturation, value] = [180, 0.5, 1];
  try {
    [hue, saturation, value] = chroma(color).hsv();
    // eslint-disable-next-line no-empty
  } catch {}

  if (Number.isNaN(hue)) {
    hue = 0;
  }

  return [hue, saturation, value];
};
