import * as Clipboard from 'expo-clipboard';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { HomeProfileLink_user$key } from '@azzapp/relay/artifacts/HomeProfileLink_user.graphql';
import type { SharedValue } from 'react-native-reanimated';

type HomeProfileLinkProps = {
  currentProfileIndex: number;
  currentProfileIndexSharedValue: SharedValue<number>;
  user: HomeProfileLink_user$key;
};
const HomeProfileLink = ({
  currentProfileIndex,
  currentProfileIndexSharedValue,
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

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: 1 + Math.min(0, currentProfileIndexSharedValue.value),
  }));

  return (
    <Animated.View style={[styles.container, opacityStyle]}>
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
    </Animated.View>
  );
};

export default memo(HomeProfileLink);

export const PROFILE_LINK_HEIGHT = 29;

export const PROFILE_LINK_MARGIN_TOP = 21;

const styles = StyleSheet.create({
  container: {
    height: PROFILE_LINK_HEIGHT,
    wdith: '100%',
    alignItems: 'center',
    marginTop: PROFILE_LINK_MARGIN_TOP,
  },
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
    height: PROFILE_LINK_HEIGHT,
    width: '82%',
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
});
