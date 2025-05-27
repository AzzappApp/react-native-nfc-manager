import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useRouter } from '#components/NativeRouter';
import { getAuthState } from '#helpers/authStore';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import { useHomeScreenContext } from './HomeScreenContext';
import type { ReactNode } from 'react';

const HomeProfileMenu = () => {
  const router = useRouter();
  const intl = useIntl();
  const onMultiUserPress = useCallback(() => {
    router.push({ route: 'MULTI_USER' });
  }, [router]);

  const onAnalyticsPress = useCallback(() => {
    router.push({ route: 'ANALYTICS' });
  }, [router]);

  const onNetworkPress = useCallback(() => {
    const { profileInfos } = getAuthState();
    let toastMessage: ReactNode[] | string | undefined = undefined;
    if (!profileInfos?.cardIsPublished) {
      toastMessage = intl.formatMessage(
        {
          defaultMessage: 'Publish WebCard{azzappA} to browse community',
          description:
            'info toast when browsing community on an unpublished webcard',
        },
        {
          azzappA: <Text variant="azzapp">a</Text>,
        },
      );
    }

    if (profileInfos?.invited) {
      toastMessage = intl.formatMessage({
        defaultMessage: 'Accept invitation to browse community',
        description: 'info toast when browsing community on an invit webcard',
      });
    }

    if (profileInfos?.coverIsPredefined) {
      toastMessage = intl.formatMessage({
        defaultMessage: 'Create a cover to browse community',
        description:
          'info toast when browsing community on an predefined cover',
      });
    }

    if (toastMessage) {
      Toast.show({
        type: 'info',
        text1: toastMessage as string,
      });
    } else {
      router.push({ route: 'MEDIA' });
    }
  }, [intl, router]);

  const { bottomContentOpacity } = useHomeScreenContext();
  const bottomPanelStyle = useAnimatedStyle(() => {
    return {
      opacity: bottomContentOpacity.value,
      pointerEvents:
        Math.round(bottomContentOpacity.value) === 1 ? 'auto' : 'none',
    };
  });

  return (
    <View style={styles.mainContainer}>
      <Animated.View style={[styles.insideContainer, bottomPanelStyle]}>
        <LinearGradient
          colors={['#FFFFFF00', '#FFFFFF26']}
          style={[styles.containerGradient, styles.containerGradientLeft]}
        >
          <Pressable
            style={styles.pressableUnderCover}
            onPress={onMultiUserPress}
          >
            <Icon
              icon="shared_webcard_thin"
              style={styles.iconStyle}
              size={20}
            />
            <Text style={styles.buttonText} variant="small">
              <FormattedMessage
                defaultMessage="Multi user"
                description="Home Profile Menu button multi user"
              />
            </Text>
          </Pressable>
        </LinearGradient>
        <LinearGradient
          colors={['#FFFFFF00', '#FFFFFF26']}
          style={styles.containerGradient}
        >
          <Pressable
            style={styles.pressableUnderCover}
            onPress={onAnalyticsPress}
          >
            <Icon icon="analytics" style={styles.iconStyle} size={20} />
            <Text style={styles.buttonText} variant="small">
              <FormattedMessage
                defaultMessage="Analytics"
                description="Home Profile Menu button analytics"
              />
            </Text>
          </Pressable>
        </LinearGradient>
        <LinearGradient
          colors={['#FFFFFF00', '#FFFFFF26']}
          style={[styles.containerGradient, styles.containerGradientRight]}
        >
          <Pressable
            style={styles.pressableUnderCover}
            onPress={onNetworkPress}
          >
            <Icon icon="earth_thin" style={styles.iconStyle} size={20} />
            <Text style={styles.buttonText} variant="small">
              <FormattedMessage
                defaultMessage="Network"
                description="Home Profile Menu button network"
              />
            </Text>
          </Pressable>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};
const CONTAINER_HEIGHT = 80;
const INSIDE_CONTAINER_HEIGHT = 168;
const MARGIN_BOTTOM = 15;
const styles = StyleSheet.create({
  iconStyle: { tintColor: 'white' },
  buttonText: { color: 'white' },
  mainContainer: {
    height: CONTAINER_HEIGHT,
    overflow: 'visible',
  },
  insideContainer: {
    position: 'absolute',
    top: CONTAINER_HEIGHT - INSIDE_CONTAINER_HEIGHT - MARGIN_BOTTOM,
    height: INSIDE_CONTAINER_HEIGHT,
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 2,
  },
  containerGradientLeft: {
    borderBottomLeftRadius: 20,
  },
  containerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  containerGradientRight: {
    borderBottomRightRadius: 20,
  },
  pressableUnderCover: {
    alignItems: 'center',
    width: '80%',
    paddingVertical: 10,
    gap: 3,
  },
});

export default HomeProfileMenu;
