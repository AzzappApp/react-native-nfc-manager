import { StyleSheet } from 'react-native';
import Button from './Button';
import { HEADER_HEIGHT } from './Header';
import type { ButtonProps } from './Button';

export const HeaderButton = ({ style, ...props }: ButtonProps) => (
  <Button {...props} style={[styles.headerButton, style]} />
);

export default HeaderButton;

const styles = StyleSheet.create({
  headerButton: {
    width: 74,
    height: HEADER_HEIGHT,
    paddingHorizontal: 0,
  },
});
