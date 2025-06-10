import * as Clipboard from 'expo-clipboard';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useFragment, graphql } from 'react-relay';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import { useTooltipContext } from '#helpers/TooltipContext';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
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
            userName
          }
        }
      }
    `,
    userKey,
  );

  const {
    currentIndexProfileSharedValue,
    currentIndexSharedValue,
    readableTextColor,
  } = useHomeScreenContext();
  const { registerTooltip, unregisterTooltip } = useTooltipContext();

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
  const onPress = useCallback(() => {
    Clipboard.setStringAsync(
      buildWebUrl(
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
  }, [intl, userNames, currentIndexProfileSharedValue]);

  const textDerivedValue = useDerivedValue(() => {
    // index 0 will be hidden, no need to update it
    const displayedItem = (currentIndexProfileSharedValue.value || 1) - 1;
    return 'azzapp.com/' + userNames.value[displayedItem];
  });

  const ref = useRef(null);

  useEffect(() => {
    registerTooltip('profileLink', {
      ref,
      onPress,
    });

    return () => {
      unregisterTooltip('profileLink');
    };
  }, [onPress, registerTooltip, unregisterTooltip]);

  const iconStyles = useAnimatedStyle(() => ({
    tintColor: readableTextColor.value,
  }));

  return (
    <View ref={ref} style={styles.container}>
      <PressableNative
        accessibilityRole="button"
        onPress={onPress}
        android_ripple={{
          borderless: true,
          foreground: true,
        }}
        style={styles.button}
      >
        <Animated.View style={[styles.containerText, opacityStyle]}>
          <Icon icon="link" style={[styles.iconLink, iconStyles]} />
          <HomeProfileLinkText text={textDerivedValue} style={styles.url} />
        </Animated.View>
      </PressableNative>
    </View>
  );
};

const HomeProfileLinkText = ({
  text,
  style,
  ...props
}: TextProps & { text: DerivedValue<string> }) => {
  // Cause a reading of shared value during render
  // eslint-disable-next-line react-compiler/react-compiler
  'use no memo';
  const [textInner, setTextInner] = useState(() => text.value);
  const { readableTextColor } = useHomeScreenContext();
  const animatedStyle = useAnimatedStyle(() => {
    return { color: readableTextColor.value };
  });

  useAnimatedReaction(
    () => text.value,
    newValue => {
      runOnJS(setTextInner)(newValue);
    },
  );
  return (
    <Animated.Text
      variant="button"
      numberOfLines={1}
      {...props}
      style={[style, animatedStyle]}
    >
      {textInner}
    </Animated.Text>
  );
};

export default memo(HomeProfileLink);

export const PROFILE_LINK_HEIGHT = 29;

export const PROFILE_LINK_MARGIN_TOP = 10;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: PROFILE_LINK_HEIGHT + 2, // 2 is the border width (for android)
    padding: 1,
    alignItems: 'center',
    marginTop: PROFILE_LINK_MARGIN_TOP,
  },
  url: {
    maxWidth: '90%',
    color: `${colors.white}BF`,
    lineHeight: 16,
    top: Platform.OS === 'ios' ? 1 : 0,
  },
  iconLink: {
    tintColor: `${colors.white}BF`,
    height: 18,
    width: 18,
  },
  containerText: {
    height: PROFILE_LINK_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: `${colors.white}1A`,
    gap: 10,
    paddingHorizontal: 13,
    overflow: 'hidden',
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
  },
});
