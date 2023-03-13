import { cloneElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { textStyles } from '#theme';
import type { ReactElement, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type HeaderProps = {
  /**
   * The title to display in the header.
   */
  title?: ReactNode;
  /**
   * The left button to display in the header.
   */
  leftButton?: ReactElement | null;
  /**
   * The right button to display in the header.
   */
  rightButton?: ReactElement | null;
  /**
   * Whether the header should be displayed in dark mode.
   */
  dark?: boolean;
  /**
   * The style to apply to the header.
   * @see https://reactnative.dev/docs/view-style-props
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * A mobile header with a title and two buttons.
 */
const Header = ({
  title,
  leftButton,
  rightButton,
  dark,
  style,
}: HeaderProps) => (
  <View style={[styles.header, dark && styles.darkHeader, style]}>
    <View style={styles.headerSegment}>
      {leftButton && cloneElement(leftButton, { dark })}
    </View>

    {typeof title === 'string' ? (
      <Text style={[textStyles.title, dark && styles.darkTitle]}>{title}</Text>
    ) : (
      <View>{title}</View>
    )}
    <View style={[styles.headerSegment, styles.headerSegmentRight]}>
      {rightButton && cloneElement(rightButton, { dark })}
    </View>
  </View>
);

export default Header;

/**
 * The height of the header.
 */
export const HEADER_HEIGHT = 44;

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  darkHeader: {
    backgroundColor: '#000',
  },
  darkTitle: {
    color: '#fff',
  },
  headerSegment: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flex: 1,
  },
  headerSegmentRight: {
    alignItems: 'flex-end',
  },
});
