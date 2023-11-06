import { StyleSheet, View } from 'react-native';
import { colors, textStyles } from '#theme';
import Text from '#ui/Text';

type AvatarProps = {
  firstName: string;
  lastName: string;
};

const Avatar = (props: AvatarProps) => {
  const { firstName, lastName } = props;
  return (
    <View style={styles.avatar}>
      <Text style={[styles.initials, textStyles.xlarge]}>
        {firstName.substring(0, 1)}
        {lastName.substring(0, 1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 56,
    backgroundColor: colors.grey100,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.grey300,
    textTransform: 'uppercase',
  },
});

export default Avatar;
