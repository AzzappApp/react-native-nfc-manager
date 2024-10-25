import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Paint,
  vec,
} from '@shopify/react-native-skia';
import { FormattedMessage } from 'react-intl';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  Easing,
  withSequence,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { convertHexToRGBA } from '@azzapp/shared/colorsHelpers';
import { colors } from '#theme';

import AnimatedText from '#components/AnimatedText';
import { useAnimatedTextToPluralValue } from '#hooks/useAnimatedTextToPluralValue';
import Text from '#ui/Text';
import type { SharedValue } from 'react-native-reanimated';

type HomeButtonContactLinkCentralProps = {
  circleWidth: number;
  primaryColor: SharedValue<string>;
  nbNewContacts: SharedValue<string>;
  onPress: () => void;
  count: SharedValue<string>;
  notificationColor: SharedValue<string>;
};

const AnimatedTextComp = Animated.createAnimatedComponent(Text);

export const HomeButtonContactLinkCentral = ({
  circleWidth,
  primaryColor,
  onPress,
  count,
  nbNewContacts,
  notificationColor,
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

  const containerStyle = [
    styles.container,
    {
      width: circleWidth,
      height: circleWidth,
    },
  ];

  const isPlural = useAnimatedTextToPluralValue(count);

  const gradients = useDerivedValue(() => {
    if (primaryColor.value.startsWith('rgba')) {
      const opacity = parseInt(
        primaryColor.value[primaryColor.value.length - 2],
        10,
      );

      return [
        primaryColor.value,
        primaryColor.value.replace(`${opacity})`, `${opacity * 0.3})`),
      ];
    }

    return [
      convertHexToRGBA(primaryColor.value, 1),
      convertHexToRGBA(primaryColor.value, 0.3),
    ];
  });

  return (
    <View style={containerStyle} pointerEvents="box-none">
      <Canvas style={[styles.circleCanvas]}>
        <Group>
          <Circle
            r={circleWidth / 2}
            cx={circleWidth / 2}
            cy={circleWidth / 2}
            color="rgba(255,255,255,0.18)"
            opacity={opacityValue}
          />
          <Circle
            r={circleWidth / 2 - 2}
            cx={circleWidth / 2}
            cy={circleWidth / 2}
            style="stroke"
          >
            <Paint style="stroke" strokeWidth={1}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, circleWidth - 2)}
                colors={gradients}
              />
            </Paint>
          </Circle>
        </Group>
      </Canvas>
      <View style={styles.textStyle}>
        <AnimatedText
          variant="xxsmallextrabold"
          text={nbNewContacts}
          appearance="dark"
          style={styles.nbNewContacts}
          animatedTextColor={notificationColor}
        />

        <AnimatedText
          variant="xlarge"
          text={count}
          appearance="dark"
          style={styles.textAlign}
        />

        <AnimatedTextComp variant="small" style={[styles.text]}>
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
    height: '100%',
    justifyContent: 'center',
    rowGap: 6,
  },
  text: {
    color: colors.white,
    textAlign: 'center',
    top: -7,
  },
  textAlign: { textAlign: 'center' },
  nbNewContacts: {
    top: -6,
    width: '100%',
    textAlign: 'center',
    position: 'absolute',
  },
});
