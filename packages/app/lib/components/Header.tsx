import { cloneElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';

type HeaderProps = {
  title?: string;
  leftButton?: ReactElement | null;
  rightButton?: ReactElement | null;
  dark?: boolean;
};

const Header = ({ title, leftButton, rightButton, dark }: HeaderProps) => (
  <View style={[styles.header, dark && styles.darkHeader]}>
    <View style={styles.headerSegment}>
      {leftButton && cloneElement(leftButton, { dark })}
    </View>

    <Text style={[styles.title, dark && styles.darkTitle]}>{title}</Text>
    <View style={[styles.headerSegment, styles.headerSegmentRight]}>
      {rightButton && cloneElement(rightButton, { dark })}
    </View>
  </View>
);

export default Header;

const styles = StyleSheet.create({
  header: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
  },
  darkHeader: {
    backgroundColor: '#000',
  },
  title: {
    fontSize: 18,
    alignSelf: 'center',
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
