import * as Clipboard from 'expo-clipboard';
import { memo, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useFragment, graphql } from 'react-relay';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import useAuthState from '#hooks/useAuthState';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { HomeProfileLink_user$key } from '#relayArtifacts/HomeProfileLink_user.graphql';

import type { SharedValue } from 'react-native-reanimated';

type HomeProfileLinkProps = {
  currentProfileIndexSharedValue: SharedValue<number>;
  user: HomeProfileLink_user$key;
};
const HomeProfileLink = ({
  currentProfileIndexSharedValue,
  user: userKey,
}: HomeProfileLinkProps) => {
  const { profiles } = useFragment(
    graphql`
      fragment HomeProfileLink_user on User {
        profiles {
          webCard {
            id
            userName
          }
        }
      }
    `,
    userKey,
  );

  const { profileInfos } = useAuthState();

  const userNames = useMemo(
    () => new Map(profiles?.map(p => [p.webCard.id, p.webCard.userName])) ?? [],
    [profiles],
  );

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 + Math.min(0, currentProfileIndexSharedValue.value),
      pointerEvents:
        currentProfileIndexSharedValue.value === -1 ? 'none' : 'auto',
    };
  }, [currentProfileIndexSharedValue]);

  const intl = useIntl();
  const onPress = () => {
    Clipboard.setStringAsync(
      buildUserUrl(userNames.get(profileInfos?.webCardId ?? '') ?? ''),
    )
      .then(() => {
        Toast.show({
          type: 'info',
          text1: intl.formatMessage({
            defaultMessage: 'Copied to clipboard',
            description:
              'Toast info message that appears when the user copies the webcard url to the clipboard',
          }),
          bottomOffset: 0,
        });
      })
      .catch(() => void 0);
  };

  return (
    <Animated.View style={[styles.container, opacityStyle]}>
      <PressableOpacity accessibilityRole="button" onPress={onPress}>
        <View style={styles.containerText}>
          <Icon icon="earth" style={styles.iconLink} />
          <Text variant="button" numberOfLines={1} style={styles.url}>
            {buildUserUrl(
              userNames.get(profileInfos?.webCardId ?? '') ?? '',
              'azzapp.com/',
            )}
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
    width: '100%',
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
