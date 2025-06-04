import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Pressable, StyleSheet, View } from 'react-native';
import { useMMKVBoolean } from 'react-native-mmkv';
import Animated, { FadeOut, useAnimatedStyle } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import { getAuthState } from '#helpers/authStore';
import { profileInfoHasAdminRight } from '#helpers/profileRoleHelper';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeProfileMenu_profile$key } from '#relayArtifacts/HomeProfileMenu_profile.graphql';
import type { ReactNode } from 'react';

const HomeProfileMenu = ({
  profile: profileKey,
}: {
  profile: HomeProfileMenu_profile$key | null;
}) => {
  const profile = useFragment(
    graphql`
      fragment HomeProfileMenu_profile on Profile {
        id
        invited
        profileRole
      }
    `,
    profileKey ?? null,
  );

  const router = useRouter();
  const intl = useIntl();

  const onMultiUserPress = useCallback(() => {
    if (profileInfoHasAdminRight(profile)) {
      router.push({
        route: 'MULTI_USER',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage: 'Your role does not permit this action',
          description:
            'Error message when trying to create a cover without the right permissions',
        }),
      });
    }
  }, [profile, router, intl]);

  const onAnalyticsPress = useCallback(() => {
    router.push({ route: 'ANALYTICS' });
  }, [router]);

  const [toolsOpened, setToolsOpened] = useMMKVBoolean(
    'toolsNotificationForEnrichment',
  );

  const onToolsPress = useCallback(() => {
    setToolsOpened(true);
    router.push({ route: 'TOOLS' });
  }, [router, setToolsOpened]);

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
          style={styles.containerGradient}
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
        <LinearGradient
          colors={['#FFFFFF00', '#FFFFFF26']}
          style={[styles.containerGradient, styles.containerGradientRight]}
        >
          <Pressable style={styles.pressableUnderCover} onPress={onToolsPress}>
            {!toolsOpened && (
              <Animated.View
                exiting={FadeOut}
                style={styles.toolsNotificationContainer}
              >
                <Text appearance="dark" variant="xsmallbold">
                  1
                </Text>
              </Animated.View>
            )}
            <Icon icon="tools" style={styles.iconStyle} size={20} />
            <Text style={styles.buttonText} variant="small">
              <FormattedMessage
                defaultMessage="Tools"
                description="Home Profile Menu button tools"
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
  toolsNotificationContainer: {
    backgroundColor: 'red',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    position: 'absolute',
    right: 10,
    top: -5,
  },
});

export default HomeProfileMenu;
