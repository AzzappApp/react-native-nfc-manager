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
  onPress: (() => void) | undefined;
  showError?: boolean;
};

const ToolBoxSection = ({ label, icon, onPress, showError = false }: Props) => {
  const styles = useStyleSheet(stylesToolbox);

  return (
    <View
      style={[
        styles.container,
        showError && { borderColor: colors.red400, borderWidth: 1 },
      ]}
    >
      <PressableNative style={styles.toolbox} onPress={onPress}>
        {typeof icon === 'string' ? (
          <Icon icon={icon} />
        ) : (
          <View style={styles.fakeIcon}>{icon}</View>
        )}
        <Text variant="xsmall">{label}</Text>
      </PressableNative>
    </View>
  );
};
export const TOOLBOX_SECTION_HEIGHT = 66;

export const stylesToolbox = createStyleSheet(appearance => ({
  container: {
    width: 70,
    height: TOOLBOX_SECTION_HEIGHT,
    borderRadius: 10,
    overflow: 'hidden',
  },
  toolbox: {
    width: 70,
    height: TOOLBOX_SECTION_HEIGHT,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
  },
  fakeIcon: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export default ToolBoxSection;
