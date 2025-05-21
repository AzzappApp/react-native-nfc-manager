import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import type { Icons } from '#ui/Icon';

export const ContactDetailAISectionSeparator = ({
  icon,
  label,
}: {
  icon: Icons;
  label: string;
}) => {
  const styles = useStyleSheet(stylesheet);

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.description}>
        <Icon icon={icon} size={32} />
        <Text variant="button">{label}</Text>
      </View>
      <View style={styles.line} />
    </View>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  container: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
    gap: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: appearance === 'dark' ? colors.white : colors.black,
  },
  description: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
}));
