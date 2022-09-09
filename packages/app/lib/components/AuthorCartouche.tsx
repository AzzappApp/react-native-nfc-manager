import { StyleSheet, View, Text } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors, fontFamilies } from '../../theme';
import type { AuthorCartoucheFragment_user$key } from '@azzapp/relay/artifacts/AuthorCartoucheFragment_user.graphql';
import type { ViewProps } from 'react-native';

const AuthorCartouche = ({
  style,
  small = false,
  author: authorKey,
  ...props
}: ViewProps & {
  author: AuthorCartoucheFragment_user$key;
  small?: boolean;
}) => {
  const author = useFragment(
    graphql`
      fragment AuthorCartoucheFragment_user on User {
        userName
      }
    `,
    authorKey,
  );
  return (
    <View
      style={[styles.container, small && styles.containerSmall, style]}
      {...props}
    >
      <View style={[styles.picture, small && styles.pictureSmall]} />
      <Text style={[styles.userName, small && styles.userNameSmall]}>
        {author.userName}
      </Text>
    </View>
  );
};

export default AuthorCartouche;

export const AUTHOR_CARTOUCHE_HEIGHT = 40;
export const AUTHOR_CARTOUCHE_SMALL_HEIGHT = 30;

const styles = StyleSheet.create({
  container: {
    height: AUTHOR_CARTOUCHE_HEIGHT,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'whithe',
  },
  containerSmall: {
    height: AUTHOR_CARTOUCHE_SMALL_HEIGHT,
    padding: 4,
    paddingEnd: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  picture: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: colors.grey200,
  },
  pictureSmall: {
    backgroundColor: '#FFF',
  },
  userName: {
    ...fontFamilies.semiBold,
    fontSize: 12,
    color: colors.dark,
  },
  userNameSmall: {
    color: 'white',
  },
});
