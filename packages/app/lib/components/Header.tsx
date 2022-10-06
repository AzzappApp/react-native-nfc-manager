import { cloneElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { textStyles } from '../../theme';
import type { ReactElement, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type HeaderProps = {
  title?: ReactNode | string;
  leftButton?: ReactElement | null;
  rightButton?: ReactElement | null;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
};

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
