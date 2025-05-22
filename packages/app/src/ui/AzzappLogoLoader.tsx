import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useColorScheme, View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { replaceColors } from '@azzapp/shared/lottieHelpers';
import { colors } from '#theme';
import useBoolean from '#hooks/useBoolean';
import { OfflineVCardScreenRenderer } from '#screens/OfflineVCardScreen';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import PressableNative from './PressableNative';
import type { ViewProps } from 'react-native';

type AzzappLogoLoaderProps = Omit<ViewProps, 'children'> & {
  logoSize?: number;
  backgroundOpacity?: number;
};

const lottie = require('../assets/logo-loader.json');

const AzzappLogoLoader = ({
  logoSize = 150,
  backgroundOpacity = 1,
  style,
  ...props
}: AzzappLogoLoaderProps) => {
  const colorScheme = useColorScheme() ?? 'light';

  const [offlineScreenDisplayed, showOfflineScreen, hideOfflineScreen] =
    useBoolean(false);

  const [displayOfflineMode, setDisplayOfflineMode] = useState(false);

  const source = useMemo(
    () =>
      colorScheme === 'light'
        ? lottie
        : replaceColors(
            [
              {
                sourceColor: '#000000',
                targetColor: '#ffffff',
              },
            ],
            lottie,
          ),
    [colorScheme],
  );

  let backgroundColor = colorScheme === 'light' ? colors.white : colors.black;
  if (backgroundOpacity < 1) {
    backgroundColor += Math.round(255 * backgroundOpacity)
      .toString(16)
      .padStart(2, '0');
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayOfflineMode(true);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor,
        },
        style,
      ]}
      {...props}
    >
      <LottieView
        source={source}
        autoPlay
        loop
        hardwareAccelerationAndroid
        style={{
          width: logoSize,
          height: logoSize,
        }}
      />

      {displayOfflineMode && (
        <Animated.View
          entering={FadeInDown}
          style={styles.offlineButtonContainer}
        >
          <PressableNative
            onPress={showOfflineScreen}
            style={styles.offlineButton}
          >
            <Icon icon="offline" style={styles.icon} />
            <Text variant="smallbold" style={styles.offlineText}>
              <FormattedMessage
                defaultMessage="Activate Offline Mode"
                description="Loading screen - activate offline mode"
              />
            </Text>
          </PressableNative>
        </Animated.View>
      )}

      {offlineScreenDisplayed && (
        <View style={StyleSheet.absoluteFill}>
          <OfflineVCardScreenRenderer
            onClose={hideOfflineScreen}
            canLeaveScreen
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  offlineText: {
    color: colors.grey200,
    textDecorationLine: 'underline',
  },
  icon: {
    tintColor: colors.grey200,
  },
  offlineButton: {
    gap: 12,
    alignItems: 'center',
  },
  offlineButtonContainer: {
    position: 'absolute',
    bottom: 45,
  },
});

export default AzzappLogoLoader;
