import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { Icons } from '#ui/Icon';
import type { ReactElement } from 'react';

type Props = {
  label: string;
  icon: Icons | ReactElement;
  onPress: () => void;
};

const ToolBoxSection = ({ label, icon, onPress }: Props) => {
  const styles = useStyleSheet(stylesToolbox);

  return (
    <PressableNative style={styles.toolbox} onPress={onPress}>
      {typeof icon === 'string' ? (
        <Icon icon={icon} />
      ) : (
        <View style={styles.fakeIcon}>{icon}</View>
      )}
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
  fakeIcon: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export const TOOLBOX_SECTION_HEIGHT = 66;

export default ToolBoxSection;
