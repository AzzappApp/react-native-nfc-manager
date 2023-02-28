import { StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

const ColorPreview = ({
  color,
  style,
}: {
  color: ColorValue;
  style: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.colorPreviewContainer, style]}>
    <View style={[styles.colorPreview, { backgroundColor: color }]} />
  </View>
);

export default ColorPreview;

const styles = StyleSheet.create({
  colorPreviewContainer: {
    height: 12,
    width: 12,
    borderRadius: 6,
    borderColor: colors.black,
    borderWidth: 1,
  },
  colorPreview: {
    height: 10,
    width: 10,
    borderRadius: 5,
    borderColor: 'white',
    borderWidth: 1,
  },
});
