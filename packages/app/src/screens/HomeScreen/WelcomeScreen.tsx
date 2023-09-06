/* eslint-disable @typescript-eslint/no-var-requires */
import { LinearGradient } from 'expo-linear-gradient';
import { useIntl } from 'react-intl';
import { Image, StyleSheet, Text, View } from 'react-native';
import { textStyles } from '#theme';
import Link from '#components/Link';
import { useMainTabBarVisiblilityController } from '#components/MainTabBar';
import Button from '#ui/Button';
import Container from '#ui/Container';
import IconButton from '#ui/IconButton';

type WelcomeScreenProps = {
  onShowMenu: () => void;
};

const WelcomeScreen = ({ onShowMenu }: WelcomeScreenProps) => {
  const intl = useIntl();
  useMainTabBarVisiblilityController(false, true);

  return (
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
        onPress={onShowMenu}
      />

      <View style={styles.content}>
        <Text style={styles.title}>
          {intl.formatMessage({
            defaultMessage: 'Welcome to Azzap',
            description: 'Title for welcome screen',
          })}
        </Text>
        <Text style={styles.subtitle}>
          {intl.formatMessage({
            defaultMessage:
              'Introduce yourself in a new way by creating your own WebCard.',
            description: 'Subtitle for welcome screen',
          })}
        </Text>
        <Link route="NEW_PROFILE" prefetch>
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Create my first webcard',
              description: 'Button label for welcome screen',
            })}
          />
        </Link>
      </View>
    </Container>
  );
};

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
    ...textStyles.xlarge,
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
});

export default WelcomeScreen;
