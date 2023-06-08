import { shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
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
  const styles = useStyleSheet(styleSheet);
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

const styleSheet = createStyleSheet(appearance => ({
  container: [
    {
      flexDirection: 'row',
      height: BOTTOM_MENU_HEIGHT,
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: 10,
      borderRadius: BOTTOM_MENU_HEIGHT / 2,
      columnGap: 10,
    },
    shadow(appearance),
  ],
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
}));

export default BottomMenu;
