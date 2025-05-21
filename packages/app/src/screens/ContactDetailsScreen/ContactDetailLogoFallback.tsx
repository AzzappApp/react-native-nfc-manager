import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';

export const ContactDetailLogoFallback = ({
  label,
}: {
  label?: string | null;
}) => {
  const styles = useStyleSheet(stylesheet);
  const intl = useIntl();
  const letters = (
    label ||
    intl.formatMessage({
      defaultMessage: `n a`,
      description:
        'ContactDetailLogoFallback the 2 first letters of the fallback logo. N A for not available by default (used in case of no company or no school)',
    })
  )
    .split(' ')
    .map(word => word[0])
    .splice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.container}>
      <Text variant="none" style={styles.text}>
        {letters}
      </Text>
    </View>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  container: {
    height: 48,
    width: 48,
    backgroundColor: appearance === 'dark' ? colors.grey100 : colors.grey900,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: appearance === 'dark' ? colors.grey900 : colors.grey50,
    fontSize: 20,
    fontWeight: 400,
  },
}));
