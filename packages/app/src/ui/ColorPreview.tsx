import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
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
}: ColorPreviewProps) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View
      style={[
        styles.colorPreviewContainer,
        {
          height: colorSize * 1.4,
          width: colorSize * 1.4,
          borderRadius: colorSize * 0.7,
        },
        style,
      ]}
      {...props}
    >
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
};

export default ColorPreview;

const styleSheet = createStyleSheet(appearance => ({
  colorPreviewContainer: {
    borderColor: appearance === 'light' ? colors.black : colors.white,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
