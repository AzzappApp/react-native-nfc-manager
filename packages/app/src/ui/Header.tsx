import { StyleSheet, View } from 'react-native';
import Text from '#ui/Text';
import Container from './Container';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, ViewProps } from 'react-native';

export type HeaderProps = Omit<ViewProps, 'children'> & {
  /**
   * The title to display in the header.
   */
  middleElement?: ReactNode;
  /**
   * The left button to display in the header.
   */
  leftElement?: ReactNode;
  /**
   * The right button to display in the header.
   */
  rightElement?: ReactNode;

  /**
   * The style to apply to the header.
   * @see https://reactnative.dev/docs/view-style-props
   */
  style?: StyleProp<ViewStyle>;

  /**
   * style applied to text middle element.
   */
  middleElementStyle?: ViewStyle;
};

/**
 * A mobile header with a title and two buttons.
 *
 * :warning: Don't change the layout of this component and put a fake view on left or right side.
 * if you need a single button, you'll be fired if you add flex: 1 to the button.
 */
const Header = ({
  middleElement,
  leftElement,
  rightElement,
  style,
  middleElementStyle,
  ...props
}: HeaderProps) => {
  return (
    <Container
      accessibilityRole="header"
      style={[styles.header, style]}
      {...props}
    >
      <View style={styles.headerInner}>
        {leftElement && <View style={styles.element}>{leftElement}</View>}
        <View
          style={[styles.headerMiddle, middleElementStyle]}
          pointerEvents="box-none"
        >
          {typeof middleElement === 'string' || Array.isArray(middleElement) ? (
            <Text
              variant="large"
              style={styles.title}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {middleElement}
            </Text>
          ) : middleElement != null ? (
            <View>{middleElement}</View>
          ) : undefined}
        </View>
        {rightElement && <View style={styles.element}>{rightElement}</View>}
      </View>
    </Container>
  );
};

export default Header;

/**
 * The height of the header. Styling guide is defining 102 px height with 45 paddingTop margin.
 * All other part of figma does not use their template button
 */
export const HEADER_HEIGHT = 47;

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  headerInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  element: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMiddle: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  title: {
    textAlign: 'center',
  },
});
