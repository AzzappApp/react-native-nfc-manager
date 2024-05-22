import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from './Icon';
import PressableNative from './PressableNative';
import Text from './Text';
import type { Icons } from './Icon';

type Props = {
  label: string;
  icon: Icons;
  onPress: () => void;
};

const ToolBoxSection = ({ label, icon, onPress }: Props) => {
  const styles = useStyleSheet(stylesToolbox);

  return (
    <PressableNative style={styles.toolbox} onPress={onPress}>
      <Icon icon={icon as Icons} />
      <Text variant="xsmall">{label}</Text>
    </PressableNative>
  );
};

export const stylesToolbox = createStyleSheet(appearance => ({
  toolbox: {
    display: 'flex',
    paddingVertical: 8,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: 1,
    flexShrink: 0,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderRadius: 10,
    width: 70,
    height: TOOLBOX_SECTION_HEIGHT,
  },
}));

export const TOOLBOX_SECTION_HEIGHT = 66;

export default ToolBoxSection;
