import * as Clipboard from 'expo-clipboard';
import { memo } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useFragment, graphql } from 'react-relay';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import AnimatedText from '#components/AnimatedText';
import useScreenDimensions from '#hooks/useScreenDimensions';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeProfileLink_user$key } from '#relayArtifacts/HomeProfileLink_user.graphql';

type HomeProfileLinkProps = {
  user: HomeProfileLink_user$key;
};
const HomeProfileLink = ({ user: userKey }: HomeProfileLinkProps) => {
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

  const { currentIndexProfileSharedValue, currentIndexSharedValue } =
    useHomeScreenContext();

  const userNames = useDerivedValue(
    () => profiles?.map(p => p.webCard?.userName) ?? [],
    [profiles],
  );

  const opacityStyle = useAnimatedStyle(() => {
    if (currentIndexSharedValue.value < 1) {
      return {
        opacity: Math.pow(currentIndexSharedValue.value, 3),
        pointerEvents: 'none',
      };
    }
    return {
      opacity:
        1 -
        currentIndexSharedValue.value +
        Math.round(currentIndexSharedValue.value),
      pointerEvents: 'auto',
    };
  });

  const intl = useIntl();
  const onPress = () => {
    Clipboard.setStringAsync(
      buildUserUrl(
        userNames.value[currentIndexProfileSharedValue.value - 1] ?? '',
      ),
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

  const text = useDerivedValue(() => {
    // index 0 will be hidden, no need to update it
    const displayedItem = (currentIndexProfileSharedValue.value || 1) - 1;
    return 'azzapp.com/' + userNames.value[displayedItem];
  });

  const { width: windowWidth } = useScreenDimensions();

  return (
    <Animated.View style={[styles.container, opacityStyle]}>
      <PressableNative
        style={styles.containerText}
        accessibilityRole="button"
        onPress={onPress}
      >
        <Icon icon="link" style={styles.iconLink} />
        <View style={styles.animatedContainer}>
          <AnimatedText
            variant="button"
            numberOfLines={1}
            style={styles.url}
            text={text}
            maxLength={windowWidth / 5}
          />
        </View>
      </PressableNative>
    </Animated.View>
  );
};

export default memo(HomeProfileLink);

export const PROFILE_LINK_HEIGHT = 29;

export const PROFILE_LINK_MARGIN_TOP = 21;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: PROFILE_LINK_HEIGHT,
    alignItems: 'center',
    marginTop: PROFILE_LINK_MARGIN_TOP,
  },
  url: {
    color: colors.white,
    lineHeight: 14,
    paddingLeft: 5,
    paddingRight: 10,
  },
  iconLink: {
    tintColor: colors.white,
    marginLeft: 10,
    height: 18,
    width: 18,
  },
  containerText: {
    height: PROFILE_LINK_HEIGHT,
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  animatedContainer: {
    maxWidth: '80%',
  },
});
