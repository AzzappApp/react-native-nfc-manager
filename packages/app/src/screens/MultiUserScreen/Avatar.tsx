import { View } from 'react-native';
import { colors, textStyles } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';

type AvatarProps = {
  firstName: string;
  lastName: string;
};

const Avatar = ({ firstName, lastName }: AvatarProps) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View style={styles.avatar}>
      <Text style={[styles.initials, textStyles.xlarge]}>
        {firstName.substring(0, 1)}
        {lastName.substring(0, 1)}
      </Text>
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 56,
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.grey50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.grey300,
    textTransform: 'uppercase',
  },
}));

export default Avatar;
