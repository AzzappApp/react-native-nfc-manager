import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';

import Icon from '#ui/Icon';
import type { ColorValue } from 'react-native';

type PremiumIndicatorProps = {
  size?: number;
  isRequired?: boolean;
  style?: any;
  color?: ColorValue;
};

const PremiumIndicator = ({
  isRequired,
  size = 15,
  style = {},
  color,
}: PremiumIndicatorProps) => {
  const styles = useStyleSheet(stylesheet);

  if (!isRequired) {
    return null;
  }

  return (
    <Icon
      icon="plus"
      size={size}
      style={[styles.icon, { tintColor: color ?? colors.red400 }, style]}
    />
  );
};

const stylesheet = createStyleSheet(() => ({
  icon: { marginLeft: 5 },
}));

export default PremiumIndicator;
