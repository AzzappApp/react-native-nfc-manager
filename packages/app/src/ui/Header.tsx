import { StyleSheet, View } from 'react-native';
import Text from '#ui/Text';
import Container from './Container';
import type { ReactElement, ReactNode } from 'react';
import type { StyleProp, ViewStyle, ViewProps } from 'react-native';
export type HeaderProps = ViewProps & {
  /**
   * The title to display in the header.
   */
  middleElement?: ReactNode | null;
  /**
   * The left button to display in the header.
   */
  leftElement?: ReactElement | null;
  /**
   * The right button to display in the header.
   */
  rightElement?: ReactElement | null;

  /**
   * The style to apply to the header.
   * @see https://reactnative.dev/docs/view-style-props
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * A mobile header with a title and two buttons.
 * we got issue with alignment of the title with right or left element, using flex 1.7 but we need to do better TODO: fix this.
 */
const Header = ({
  middleElement,
  leftElement,
  rightElement,
  style,
  ...props
}: HeaderProps) => {
  return (
    <Container style={[styles.header, style]} {...props}>
      <View style={styles.headerSegment}>{leftElement}</View>
      <View style={styles.headerMiddle}>
        {typeof middleElement === 'string' ? (
          <Text variant="large">{middleElement}</Text>
        ) : middleElement != null ? (
          <View>{middleElement}</View>
        ) : undefined}
      </View>
      <View style={[styles.headerSegment, styles.headerSegmentRight]}>
        {rightElement}
      </View>
    </Container>
  );
};

export default Header;

/**
 * The height of the header. Styling guide is defining 102 px height wiht 45 paddingTop margin.
 * All other part of figma does not use their template button
 * */
export const HEADER_HEIGHT = 47;

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  headerMiddle: {
    flex: 1.7,
    justifyContent: 'center',
    alignItems: 'center',
    height: 47,
  },
  headerSegment: {
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    flex: 1,
  },
  headerSegmentRight: {
    alignItems: 'flex-end',
  },
});
