import { StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import type { ColorValue, ViewProps } from 'react-native';

type ColorPreviewProps = ViewProps & {
  /**
   * The color to preview
   *
   * @type {ColorValue}
   */
  color: ColorValue;
  /**
   *
   *
   * @type {ViewProps['style']}
   */
  style?: ViewProps['style'];
  /**
   * size of the color preview dot
   *
   * @type {number}
   */
  colorSize?: number;
};
/**
 * A simple circle that shows a color.
 */
const ColorPreview = ({
  color,
  style,
  colorSize = 10,
  ...props
}: ColorPreviewProps) => (
  <View style={[styles.colorPreviewContainer, style]} {...props}>
    <View
      style={{
        backgroundColor: color,
        width: colorSize,
        height: colorSize,
        borderRadius: colorSize / 2,
      }}
    />
  </View>
);

export default ColorPreview;

const styles = StyleSheet.create({
  colorPreviewContainer: {
    borderColor: colors.black,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 14,
    width: 14,
    borderRadius: 7,
  },
});
