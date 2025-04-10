import LottieView from 'lottie-react-native';
import { useMemo } from 'react';
import { useColorScheme, View } from 'react-native';
import { replaceColors } from '@azzapp/shared/lottieHelpers';
import { colors } from '#theme';
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
    </View>
  );
};

export default AzzappLogoLoader;
