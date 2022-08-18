import { StyleSheet, View, Text } from 'react-native';
import { fontFamilies } from '../../theme';
import type { ViewProps } from 'react-native';

const AuthorCartouche = ({
  userName,
  style,
  ...props
}: ViewProps & { userName: string }) => (
  <View style={[styles.authorCartouche, style]} {...props}>
    <View style={styles.picture} />
    <Text style={styles.authorUserName}>{userName}</Text>
  </View>
);

export default AuthorCartouche;

const styles = StyleSheet.create({
  authorCartouche: {
    height: 30,
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
    backgroundColor: '#FFF',
  },
  authorUserName: {
    ...fontFamilies.semiBold,
    fontSize: 12,
    color: 'white',
  },
});
