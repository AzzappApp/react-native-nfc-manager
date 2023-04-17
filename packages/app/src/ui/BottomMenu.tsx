import { StyleSheet } from 'react-native';
import FooterBar from './FooterBar';
import type { FooterBarProps } from './FooterBar';

export type BottomMenuProps = Omit<FooterBarProps, 'decoration'> & {
  showLabel?: boolean;
};

export const BOTTOM_MENU_HEIGHT = 70;

/**
 * A simple tabs bar component, this component is controlled
 * and does not hold any state.
 *
 * @param props
 */
const BottomMenu = ({
  showLabel = false,
  style,
  ...props
}: BottomMenuProps) => {
  return (
    <FooterBar
      height={BOTTOM_MENU_HEIGHT}
      iconSize={24}
      {...props}
      decoration={showLabel ? 'label' : 'none'}
      style={[styles.container, style]}
      tabItemStyle={styles.tab}
      showCircle
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: BOTTOM_MENU_HEIGHT,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: BOTTOM_MENU_HEIGHT / 2,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8.7 },
    shadowRadius: 19.8,
    columnGap: 10,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
});

export default BottomMenu;
