import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';

import Icon from '#ui/Icon';

type PremiumIndicatorProps = {
  size?: number;
  isRequired?: boolean;
};

const PremiumIndicator = ({ isRequired, size = 15 }: PremiumIndicatorProps) => {
  const styles = useStyleSheet(stylesheet);

  if (!isRequired) {
    return null;
  }

  return <Icon icon="plus" size={size} style={styles.icon} />;
};

const stylesheet = createStyleSheet(() => ({
  icon: { marginLeft: 5 },
}));

export default PremiumIndicator;
