import { Video } from 'expo-av';
import { useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import Link from '#components/Link';
import { setMainTabBarOpacity } from '#components/MainTabBar';
import { useRouter } from '#components/NativeRouter';
import { onChangeWebCard } from '#helpers/authStore';
import relayScreen from '#helpers/relayScreen';
import { useProfileInfos } from '#hooks/authStateHooks';
import useBoolean from '#hooks/useBoolean';
import useScreenInsets from '#hooks/useScreenInsets';
import { useSetRevenueCatUserInfo } from '#hooks/useSetRevenueCatUserInfo';
import Button from '#ui/Button';
import IconButton from '#ui/IconButton';
import LoadingView from '#ui/LoadingView';
import Text from '#ui/Text';
import HomeBottomSheetPanel from './HomeBottomSheetPanel';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { WelcomeScreenQuery } from '#relayArtifacts/WelcomeScreenQuery.graphql';
import type { OnboardingRoute } from '#routes';

export const WelcomeScreen = ({
  hasFocus,
  preloadedQuery,
}: RelayScreenProps<OnboardingRoute, WelcomeScreenQuery>) => {
  const { currentUser } = usePreloadedQuery(welcomeScreenQuery, preloadedQuery);

  useSetRevenueCatUserInfo(currentUser);

  const intl = useIntl();

  useEffect(() => {
    if (hasFocus) {
      setMainTabBarOpacity(0);
    }
    return () => {
      setMainTabBarOpacity(1);
    };
  }, [hasFocus]);

  const [showMenu, open, close] = useBoolean(false);

  const profileInfos = useProfileInfos();

  const router = useRouter();

  const profilesCountRef = useRef(currentUser?.profiles?.length);

  useEffect(() => {
    if (profilesCountRef.current === 0 && currentUser?.profiles?.length === 1) {
      const newProfile = currentUser.profiles[0];
      onChangeWebCard({
        profileId: newProfile.id,
        webCardId: newProfile.webCard?.id ?? null,
        profileRole: newProfile.profileRole,
        invited: newProfile.invited,
      });
      router.replace({ route: 'HOME' });
    } else if (currentUser?.profiles?.length === 0) {
      onChangeWebCard(null);
    }
    profilesCountRef.current = currentUser?.profiles?.length;
  }, [currentUser, router]);

  const { width } = useWindowDimensions();
  const { top } = useScreenInsets();
  return profileInfos?.profileId ? (
    <LoadingView />
  ) : (
    <View style={[styles.container, { paddingTop: top }]}>
      <View style={styles.header}>
        <Image
          source={require('#assets/welcome/welcome_logo.png')}
          style={styles.logo}
        />
        <IconButton
          icon="menu"
          style={styles.menu}
          iconStyle={{ tintColor: colors.black }}
          onPress={open}
        />
      </View>
      <Video
        source={require('../../assets/welcome/home_welcome.mp4')}
        isLooping
        isMuted
        shouldPlay={hasFocus}
        style={{
          width,
          height: width,
        }}
      />
      <View style={styles.content}>
        <Text variant="xlarge" style={styles.title} appearance="light">
          {intl.formatMessage({
            defaultMessage: 'Welcome to Azzap',
            description: 'Title for welcome screen',
          })}
        </Text>
        <Text style={styles.subtitle} appearance="light">
          <FormattedMessage
            defaultMessage="Introduce yourself in a new way by creating your own WebCard{azzappA}."
            description="Subtitle for welcome screen"
            values={{
              azzappA: <Text variant="azzapp">a</Text>,
            }}
          />
        </Text>
        <Link
          route="CONTACT_CARD_CREATE"
          params={{ launchedFromWelcomeScreen: true }}
        >
          <Button
            label={intl.formatMessage(
              {
                defaultMessage: 'Create my first WebCard{azzappA}',
                description: 'Button label for welcome screen',
              },
              {
                azzappA: (
                  <Text style={styles.icon} variant="azzapp">
                    a
                  </Text>
                ),
              },
            )}
            appearance="light"
          />
        </Link>
      </View>
      <HomeBottomSheetPanel
        visible={showMenu}
        close={close}
        user={currentUser}
      />
    </View>
  );
};

const welcomeScreenQuery = graphql`
  query WelcomeScreenQuery {
    currentUser {
      id
      profiles {
        id
        profileRole
        invited
        webCard {
          id
        }
      }
      ...HomeBottomSheetPanel_user
      ...useSetRevenueCatUserInfo_user
    }
  }
`;

const WelcomeRelayScreen = relayScreen(WelcomeScreen, {
  query: welcomeScreenQuery,
  profileBound: false,
  canGoBack: false,
  pollInterval: 30000,
});

WelcomeRelayScreen.getScreenOptions = (): ScreenOptions => ({
  stackAnimation: 'none',
});

export default WelcomeRelayScreen;
const BOTTOM_HEIGHT = 280;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  logo: {
    marginHorizontal: 120,

    position: 'absolute',
  },
  imageContainer: {
    marginTop: 70,
    height: '60%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: colors.white,
    height: BOTTOM_HEIGHT,
    paddingBottom: 100,
  },
  title: {
    marginBottom: 14,
  },
  subtitle: {
    marginHorizontal: 50,
    textAlign: 'center',
    marginBottom: 40,
  },
  menu: {
    position: 'absolute',
    top: -10,
    right: 25,
    borderWidth: 0,
  },
  icon: {
    color: colors.white,
  },
  header: { backgroundColor: colors.white, height: 50 },
});
