import * as Clipboard from 'expo-clipboard';
import { memo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useFragment, graphql } from 'react-relay';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeProfileLink_user$key } from '#relayArtifacts/HomeProfileLink_user.graphql';
import type { TextProps } from '#ui/Text';
import type { DerivedValue } from 'react-native-reanimated';

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

  const textDerivedValue = useDerivedValue(() => {
    if (currentIndexSharedValue.value > 0.5) {
      return (
        'azzapp.com/' +
        userNames.value[Math.round(currentIndexSharedValue.value - 1)]
      );
    }

    return 'azzapp.com';
  });

  return (
    <Animated.View style={[styles.container, opacityStyle]}>
      <PressableNative
        style={styles.containerText}
        accessibilityRole="button"
        onPress={onPress}
      >
        <Icon icon="earth" style={styles.iconLink} />
        <HomeProfileLinkText text={textDerivedValue} style={styles.url} />
        <View style={styles.emptyViewCenter} />
      </PressableNative>
    </Animated.View>
  );
};

const HomeProfileLinkText = ({
  text,
  ...props
}: TextProps & { text: DerivedValue<string> }) => {
  const [textInner, setTextInner] = useState(() => text.value);

  useAnimatedReaction(
    () => text.value,
    newValue => {
      runOnJS(setTextInner)(newValue);
    },
  );
  return (
    <Text variant="button" numberOfLines={1} {...props}>
      {textInner}
    </Text>
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
