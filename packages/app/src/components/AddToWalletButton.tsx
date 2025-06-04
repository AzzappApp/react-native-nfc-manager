import { Image } from 'expo-image';
import { FormattedMessage } from 'react-intl';
import {
  ActivityIndicator,
  Platform,
  useColorScheme,
  View,
} from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { useGenerateLoadingPass } from '#hooks/useGenerateLoadingPass';
import PressableNative from '../ui/PressableNative';
import Text from '../ui/Text';
import type { ColorSchemeName, ViewStyle } from 'react-native';

type Props = {
  contactCardAccessId: string;
  publicKey: string;
  style?: ViewStyle;
  appearance?: ColorSchemeName;
};

const AddToWalletButton = ({
  contactCardAccessId,
  publicKey,
  style,
  appearance,
}: Props) => {
  const scheme = useColorScheme();
  const colorScheme = appearance || scheme;
  const styles = useStyleSheet(styleSheet, colorScheme);

  const [generateLoadingPass, loadingPass] = useGenerateLoadingPass({
    contactCardAccessId,
    publicKey,
  });

  return (
    <>
      {Platform.OS === 'ios' && (
        <View style={[styles.addToWalletContainer, style]}>
          <PressableNative
            testID="add-to-wallet-button"
            disabled={loadingPass}
            style={styles.addToWalletButton}
            onPress={generateLoadingPass}
          >
            {loadingPass ? (
              <ActivityIndicator
                color={colorScheme === 'dark' ? 'black' : 'white'}
                style={styles.addToWalletIcon}
              />
            ) : (
              <Image
                source={require('#assets/wallet.png')}
                style={styles.addToWalletIcon}
                cachePolicy="none"
              />
            )}
            <Text variant="button" style={styles.addToWalletButtonText}>
              <FormattedMessage
                defaultMessage="Add to Apple Wallet"
                description="Add to Apple Wallet button label"
              />
            </Text>
          </PressableNative>
        </View>
      )}
      {Platform.OS === 'android' && (
        <View
          style={[
            styles.googleWalletButtonContainer,
            styles.googleWalletButton,
          ]}
        >
          <PressableNative
            testID="add-to-wallet-button"
            disabled={loadingPass}
            onPress={generateLoadingPass}
            android_ripple={{
              foreground: true,
              borderless: false,
              color: colorScheme === 'dark' ? colors.grey100 : colors.grey900,
            }}
            style={styles.googleWalletButton}
          >
            <Image
              source={require('#assets/google-wallet.svg')}
              style={styles.googleWalletLogo}
              contentFit="contain"
            />
          </PressableNative>
          {loadingPass && (
            <View style={styles.googleWalletLoadingContainer}>
              <ActivityIndicator
                color={colorScheme === 'dark' ? 'black' : 'white'}
              />
            </View>
          )}
        </View>
      )}
    </>
  );
};

export default AddToWalletButton;

const styleSheet = createStyleSheet(appearance => ({
  addToWalletIcon: {
    width: 38,
    height: 37,
    position: 'absolute',
    left: 10,
    marginVertical: 'auto',
  },
  addToWalletContainer: {
    overflow: 'hidden',
    borderRadius: 12,
    width: '100%',
  },
  addToWalletButton: {
    width: '100%',
    height: 47,
    borderRadius: 12,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToWalletButtonText: {
    color: appearance === 'light' ? colors.white : colors.black,
  },
  googleWalletLogo: {
    height: 47,
    overflow: 'visible',
  },
  googleWalletButton: {
    aspectRatio: 283 / 50, // derived from google wallet logo svg
    height: 47,
    alignSelf: 'center',
  },
  googleWalletButtonContainer: {
    overflow: 'hidden',
    borderRadius: 40,
  },
  googleWalletLoadingContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
