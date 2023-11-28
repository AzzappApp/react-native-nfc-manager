/* eslint-disable @typescript-eslint/no-var-requires */
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, StyleSheet, View } from 'react-native';
import { mainRoutes } from '#mobileRoutes';
import { colors } from '#theme';
import Link from '#components/Link';
import { useMainTabBarVisibilityController } from '#components/MainTabBar';
import { useRouter } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
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

const WelcomeScreen = () => {
  const intl = useIntl();
  useMainTabBarVisibilityController(false, true);

  const [showMenu, toggleShowMenu] = useToggle(false);

  useEffect(() => {
    dispatchGlobalEvent({ type: 'READY' });
  }, []);

  const { webCardId } = useAuthState();

  const router = useRouter();

  const goBackToHome = useCallback(() => {
    if (webCardId) {
      router.replaceAll(mainRoutes(false));
    }
  }, [webCardId, router]);

  useFocusEffect(goBackToHome);

  return webCardId ? (
    <Container
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <ActivityIndicator />
    </Container>
  ) : (
    <Container style={{ flex: 1 }}>
      <LinearGradient colors={['#FF688C', '#FFF']} style={styles.linear} />
      <Image
        source={require('#assets/logo-full_white.png')}
        style={styles.logo}
      />
      <View style={styles.imageContainer}>
        <Image source={require('#assets/welcome.png')} style={styles.image} />
      </View>
      <IconButton
        icon="menu"
        style={styles.menu}
        iconStyle={{ tintColor: 'white' }}
        onPress={toggleShowMenu}
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
        <Link route="NEW_WEBCARD" prefetch>
          <Button
            label={intl.formatMessage(
              {
                defaultMessage: 'Create my first webcard{azzappA}',
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
        withProfile={false}
      />
    </Container>
  );
};

WelcomeScreen.getScreenOptions = (): ScreenOptions => ({
  stackAnimation: 'none',
});

const styles = StyleSheet.create({
  linear: {
    height: '50%',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  },
  logo: {
    marginHorizontal: 120,
    top: 50,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    top: 39,
    right: 25,
    borderWidth: 0,
  },
  icon: {
    color: colors.white,
  },
});

export default WelcomeScreen;
