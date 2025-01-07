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
    // index 0 will be hidden, no need to update it
    const displayedItem = (currentIndexProfileSharedValue.value || 1) - 1;
    return 'azzapp.com/' + userNames.value[displayedItem];
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
    width: '100%',
    height: PROFILE_LINK_HEIGHT + 2, // 2 is the border width (for android)
    padding: 1,
    alignItems: 'center',
    marginTop: PROFILE_LINK_MARGIN_TOP,
  },
  url: {
    color: colors.white,
    lineHeight: 14,
    paddingLeft: 5,
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
  emptyViewCenter: {
    marginRight: 13,
    height: 18,
  },
});
