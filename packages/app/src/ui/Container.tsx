import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';

import type { ColorSchemeName, ViewProps } from 'react-native';

type ContainerProps = ViewProps & {
  /**
   * Force the appearance of the container
   *
   * @type {ColorSchemeName}
   */
  appearance?: ColorSchemeName;
};
/**
 * A wrapper Component around View that implement the dark mode.
 *
 * Use it only as a container on top level of your screen  or component WHEN dark mode is needed
 * Prefer using native view with default transparent background by default
 *
 */
const Container = ({ appearance, ...props }: ContainerProps) => {
  const styles = useStyleSheet(styleSheet, appearance);

  return <View {...props} style={[styles.view, props.style]} />;
};

const styleSheet = createStyleSheet(appearance => ({
  view: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
}));

export default Container;
