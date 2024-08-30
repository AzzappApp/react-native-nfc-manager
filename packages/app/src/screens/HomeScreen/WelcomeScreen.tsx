/* eslint-disable @typescript-eslint/no-var-requires */
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, useColorScheme, useWindowDimensions, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { mainRoutes } from '#mobileRoutes';
import { colors } from '#theme';
import Link from '#components/Link';
import { useMainTabBarVisibilityController } from '#components/MainTabBar';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import relayScreen from '#helpers/relayScreen';
import useAuthState from '#hooks/useAuthState';
import { useFocusEffect } from '#hooks/useFocusEffect';
import useToggle from '#hooks/useToggle';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button from '#ui/Button';
import Container from '#ui/Container';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import HomeBottomSheetPanel from './HomeBottomSheetPanel';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { WelcomeScreenQuery } from '#relayArtifacts/WelcomeScreenQuery.graphql';
import type { OnboardingRoute } from '#routes';

const WelcomeScreen = ({
  preloadedQuery,
}: RelayScreenProps<OnboardingRoute, WelcomeScreenQuery>) => {
  const { currentUser } = usePreloadedQuery(welcomeScreenQuery, preloadedQuery);

  const intl = useIntl();
  useMainTabBarVisibilityController(false, true);

  const [showMenu, toggleShowMenu] = useToggle(false);

  useEffect(() => {
    dispatchGlobalEvent({ type: 'READY' });
  }, []);

  const { profileInfos } = useAuthState();

  const router = useRouter();

  const goBackToHome = useCallback(() => {
    if (profileInfos?.webCardId) {
      router.replaceAll(mainRoutes(false));
    }
  }, [profileInfos, router]);

  useFocusEffect(goBackToHome);
  const colorScheme = useColorScheme();
  const { height } = useWindowDimensions();
  const styles = useStyleSheet(styleSheet);
  return profileInfos?.profileId ? (
    <Container
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <ActivityIndicator />
    </Container>
  ) : (
    <Container style={{ flex: 1, justifyContent: 'space-between' }}>
      <LottieView
        source={require('../../assets/sign/login_sign_up_asset.json')}
        autoPlay
        loop
        hardwareAccelerationAndroid
        style={{
          width: '100%',
          height: height - BOTTOM_HEIGHT,

          position: 'absolute',
          top: 0,
        }}
        resizeMode="cover"
      />
      <View style={styles.header}>
        <Image
          source={require('#assets/logo-full_white.png')}
          style={styles.logo}
        />
        <IconButton
          icon="menu"
          style={styles.menu}
          iconStyle={{ tintColor: 'white' }}
          onPress={toggleShowMenu}
        />
      </View>
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 1)',
          'rgba(0, 0, 0, 0)',
          colorScheme === 'light'
            ? 'rgba(255, 255, 255, 1)'
            : 'rgba(0, 0, 0, 1)',
        ]}
        style={[styles.linear, { height: height - BOTTOM_HEIGHT - 100 }]}
      />

      <View style={styles.content}>
        <Text variant="xlarge" style={styles.title}>
          {intl.formatMessage({
            defaultMessage: 'Welcome to Azzap',
            description: 'Title for welcome screen',
          })}
        </Text>
        <Text style={styles.subtitle}>
          <FormattedMessage
            defaultMessage="Introduce yourself in a new way by creating your own WebCard{azzappA}."
            description="Subtitle for welcome screen"
            values={{
              azzappA: <Text variant="azzapp">a</Text>,
            }}
          />
        </Text>
        <Link route="WEBCARD_KIND_SELECTION" prefetch>
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
          />
        </Link>
      </View>
      <HomeBottomSheetPanel
        visible={showMenu}
        close={toggleShowMenu}
        userIsPremium={currentUser?.isPremium}
      />
    </Container>
  );
};

const welcomeScreenQuery = graphql`
  query WelcomeScreenQuery {
    currentUser {
      id
      isPremium
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
const styleSheet = createStyleSheet(appearance => ({
  linear: {
    position: 'absolute',
    top: 100,
    left: 0,
    width: '100%',
    pointerEvents: 'none',
  },
  logo: {
    marginHorizontal: 120,
    top: 60,
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
    backgroundColor: appearance === 'light' ? colors.white : 'black',
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
    top: 49,
    right: 25,
    borderWidth: 0,
  },
  icon: {
    color: colors.white,
  },
  header: { backgroundColor: 'black', height: 100 },
}));
