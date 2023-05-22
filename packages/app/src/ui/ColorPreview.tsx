import { StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import type { ColorValue, ViewProps } from 'react-native';

/**
 * A simple circle that shows a color.
 */
const ColorPreview = ({
  color,
  style,
  ...props
}: ViewProps & {
  /**
   * The color to show.
   */
  color: ColorValue;
}) => (
  <View style={[styles.colorPreviewContainer, style]} {...props}>
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
