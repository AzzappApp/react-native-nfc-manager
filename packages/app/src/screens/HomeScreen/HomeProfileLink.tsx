import * as Clipboard from 'expo-clipboard';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { HomeProfileLink_user$key } from '@azzapp/relay/artifacts/HomeProfileLink_user.graphql';

type HomeProfileLinkProps = {
  currentProfileIndex: number;
  user: HomeProfileLink_user$key;
};
const HomeProfileLink = ({
  currentProfileIndex,
  user: userKey,
}: HomeProfileLinkProps) => {
  const user = useFragment(
    graphql`
      fragment HomeProfileLink_user on User {
        profiles {
          id
          userName
        }
      }
    `,
    userKey,
  );

  const profiles = user.profiles ?? [];
  const userName = profiles[Math.max(currentProfileIndex, 0)]?.userName;
  const url = buildUserUrl(userName) ?? null;

  return (
    <View style={styles.container}>
      <PressableOpacity
        accessibilityRole="button"
        onPress={() => Clipboard.setStringAsync(url)}
      >
        <View style={styles.containerText}>
          <Icon icon="earth" style={styles.iconLink} />
          <Text variant="button" numberOfLines={1} style={styles.url}>
            {url.replace('https://', '')}
          </Text>
          <View style={styles.emptyViewCenter} />
        </View>
      </PressableOpacity>
    </View>
  );
};

export default memo(HomeProfileLink);

const styles = StyleSheet.create({
  emptyViewCenter: {
    marginRight: 13,
    height: 18,
    width: 18,
  },
  url: { color: colors.white, flex: 1, textAlign: 'center' },
  iconLink: {
    tintColor: colors.white,
    marginLeft: 13,
    height: 18,
    width: 18,
  },
  containerText: {
    height: 29,
    width: '82%',
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  container: {
    height: 29,
    wdith: '100%',
    alignItems: 'center',
    marginTop: 21,
  },
});
