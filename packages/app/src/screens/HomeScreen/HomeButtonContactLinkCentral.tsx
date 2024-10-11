import {
  BlendColor,
  Canvas,
  Circle,
  Group,
  ImageSVG,
  Paint,
  Shadow,
  useSVG,
} from '@shopify/react-native-skia';
import { FormattedMessage } from 'react-intl';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  Easing,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { colors } from '#theme';

import AnimatedText from '#components/AnimatedText';
import { useAnimatedTextToPluralValue } from '#hooks/useAnimatedTextToPluralValue';
import Text from '#ui/Text';
import type { SharedValue } from 'react-native-reanimated';

type HomeButtonContactLinkCentralProps = {
  circleWidth: number;
  primaryColor: SharedValue<string>;
  contactsTextColor: SharedValue<string>;
  onPress: () => void;
  count: SharedValue<string>;
};

const AnimatedTextComp = Animated.createAnimatedComponent(Text);

export const HomeButtonContactLinkCentral = ({
  circleWidth,
  primaryColor,
  onPress,
  count,
  contactsTextColor,
}: HomeButtonContactLinkCentralProps) => {
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

  const contactCountTransform = [
    { translateY: circleWidth / 2 - (svg?.height() || 0) / 2 - 23 },
    { translateX: circleWidth / 2 - (svg?.width() || 0) / 2 },
  ];

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
      top: 0.37 * circleWidth,
    },
  ];

  const isPlural = useAnimatedTextToPluralValue(count);

  const textColorStyle = useAnimatedStyle(() => {
    return { color: contactsTextColor.value };
  });

  return (
    <View style={containerStyle} pointerEvents="box-none">
      <Canvas style={styles.circleCanvas}>
        <Group>
          <Circle
            r={circleWidth / 2}
            cx={circleWidth / 2}
            cy={circleWidth / 2}
            color={primaryColor}
            opacity={opacityValue}
          >
            <Shadow dx={1} dy={1} blur={2} color="#FFFFFF50" inner />
            <Shadow dx={-1} dy={-1} blur={2} color="#00000050" inner />
          </Circle>
        </Group>
        <Group
          transform={contactCountTransform}
          layer={
            <Paint>
              <BlendColor color={contactsTextColor} mode="srcIn" />
            </Paint>
          }
        >
          <ImageSVG svg={svg} />
        </Group>
      </Canvas>
      <View style={textStyle}>
        <AnimatedText
          variant="xlarge"
          text={count}
          appearance="dark"
          style={styles.textAlign}
          animatedTextColor={contactsTextColor}
        />

        <AnimatedTextComp variant="small" style={[styles.text, textColorStyle]}>
          <FormattedMessage
            defaultMessage="{isPlural, plural,
                                    =0 {contacts}
                                    =1 {contact}
                                    other {contacts}
                                }"
            description="HomeScreen - information panel - contacts label -- Note: the internal value is 0 for singular, 1 for plural "
            values={{ isPlural }}
          />
        </AnimatedTextComp>
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
  textStyle: {
    position: 'absolute',
    width: '100%',
    rowGap: 5,
  },
  text: {
    color: colors.white,
    textAlign: 'center',
    top: -7,
  },
  textAlign: { textAlign: 'center' },
});
