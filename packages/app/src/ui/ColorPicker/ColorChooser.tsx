import chroma from 'chroma-js';
import { StyleSheet, View } from 'react-native';
import HuePicker from './HuePicker';
import RGBHexColorPicker from './RGBHexColorPicker';
import SaturationValuePicker from './SaturationValuePicker';
import type { StyleProp, ViewStyle } from 'react-native';

export type ColorChooserProps = {
  value: string;
  onChangeColor: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

const ColorChooser = ({ value, onChangeColor, style }: ColorChooserProps) => {
  const [hue, saturation, val] = hexToHSV(value);
  const onSatValChange = ([saturation, val]: [number, number]) => {
    onChangeColor(chroma.hsv(hue, saturation, val).hex());
  };

  const onHueChange = (hue: number) => {
    onChangeColor(chroma.hsv(hue, saturation, val).hex());
  };

  const onHexChange = (hex: string) => {
    onChangeColor(hex);
  };

  return (
    <View style={[style]}>
      <SaturationValuePicker
        hue={hue}
        value={[saturation, val]}
        onChange={onSatValChange}
        style={styles.saturationValuePicker}
      />
      <HuePicker value={hue} onChange={onHueChange} style={styles.huePicker} />
      <RGBHexColorPicker
        hue={hue}
        value={[saturation, val]}
        onChange={onHexChange}
      />
    </View>
  );
};

export default ColorChooser;

const styles = StyleSheet.create({
  saturationValuePicker: {
    height: 117,
    borderRadius: 20,
  },
  huePicker: {
    borderRadius: 4,
    marginTop: 20,
    marginBottom: 30,
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
