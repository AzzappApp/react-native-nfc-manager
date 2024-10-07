import {
  Canvas,
  Circle,
  Group,
  ImageSVG,
  Shadow,
  useSVG,
} from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  useSharedValue,
  Easing,
  withSequence,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { colors } from '#theme';

import AnimatedText from '#components/AnimatedText';
import Text from '#ui/Text';
import type { SharedValue } from 'react-native-reanimated';

type HomeButtonContactLinkCentralProps = {
  circleWidth: number;
  primaryColor: SharedValue<string>;
  onPress: () => void;
  count: SharedValue<string>;
};

export const HomeButtonContactLinkCentral = ({
  circleWidth,
  primaryColor,
  onPress,
  count,
}: HomeButtonContactLinkCentralProps) => {
  const sharedCircleWidth = useSharedValue(circleWidth);

  useEffect(() => {
    sharedCircleWidth.value = circleWidth / 2;
  }, [circleWidth, sharedCircleWidth]);

  const opacityValue = useSharedValue(1);

  const easing = Easing.inOut(Easing.ease);

  const onFade = () => {
    opacityValue.value = withSequence(
      withTiming(0.8, {
        duration: 150,
        easing,
      }),
      withTiming(1, {
        duration: 150,
        easing,
      }),
    );
  };
  const svg = useSVG(require('#assets/home-contact.svg'));

  const contactCountTransform = useDerivedValue(() => {
    return [
      { translateY: sharedCircleWidth.value - (svg?.height() || 0) / 2 - 25 },
      { translateX: sharedCircleWidth.value - (svg?.width() || 0) / 2 },
    ];
  });
  const containerStyle = [
    styles.container,
    {
      width: circleWidth,
      height: circleWidth,
    },
  ];

  const textStyle = [
    styles.textStyle,
    {
      top: (9 * circleWidth) / 24,
    },
  ];

  return (
    <View style={containerStyle} pointerEvents="box-none">
      <Canvas style={styles.circleCanvas}>
        <Group>
          <Circle
            r={sharedCircleWidth}
            cx={sharedCircleWidth}
            cy={sharedCircleWidth}
            color={primaryColor}
            opacity={opacityValue}
          >
            <Shadow dx={1} dy={1} blur={2} color="#FFFFFF50" inner />
            <Shadow dx={-1} dy={-1} blur={2} color="#00000050" inner />
          </Circle>
        </Group>
        <Group transform={contactCountTransform}>
          <ImageSVG svg={svg} />
        </Group>
      </Canvas>
      <View style={textStyle}>
        <AnimatedText
          variant="xlarge"
          text={count}
          appearance="dark"
          style={styles.textAlign}
        />

        <Text variant="small" style={styles.text}>
          <FormattedMessage
            defaultMessage="Contacts"
            description="HomeScreen - information panel - contacts label"
          />
        </Text>
      </View>
      <Pressable
        style={styles.circlePressable}
        onPressOut={onPress}
        onPressIn={onFade}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignContent: 'center',
    justifyContent: 'center',
  },
  circlePressable: {
    left: '5%',
    width: '90%',
    height: '90%',
    position: 'absolute',
  },
  circleCanvas: { flex: 1 },
  textStyle: { position: 'absolute', width: '100%' },
  text: {
    color: colors.white,
    textAlign: 'center',
  },
  textAlign: { textAlign: 'center' },
});
