import {
  Canvas,
  Group,
  ImageSVG,
  Skia,
  useCanvasRef,
} from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { colors } from '#theme';
import AnimatedText from '#components/AnimatedText';
import { useAnimatedTextToPluralValue } from '#hooks/useAnimatedTextToPluralValue';
import Text from '#ui/Text';
import type { LayoutChangeEvent } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type HomeButtonContactLinkProps = {
  count: SharedValue<string>;
  onPress?: () => void;
  isLeft?: boolean;
  isTop?: boolean;
  renderMessageComponent: (isPlural: number) => JSX.Element;
};

export const HomeButtonContactLink = ({
  count,
  onPress,
  isLeft,
  isTop,
  renderMessageComponent,
}: HomeButtonContactLinkProps) => {
  const animationDuration = 150;
  const defaultOpacity = 0.18;
  const pressOpacity = 0.3;
  const gap = 6;

  const [layoutRegion, setLayoutRegion] = useState({ height: 0, width: 0 });

  /// These values are used to configure SVG
  /// we cannot stupidely scale the svg, else the circle will be deformed
  /// then we take the svg and apply elongation at the good place.
  const svgWidth = 162;
  const svgHeight = 93;

  const yGap = layoutRegion.height - svgHeight - gap;
  const yCoef2 = 91.4748 + yGap;
  const yCoef3 = 89.481 + yGap;
  const yCoef4 = 68.9476 + yGap;
  const yCoef5 = 87.6274 + yGap;
  const yCoef6 = 52.7633 + yGap;
  const yCoef7 = 46.8196 + yGap;
  const yCoef8 = 48.5104 + yGap;
  const yCoef9 = 48.8868 + yGap;
  const yCoef10 = 44.7906 + yGap;
  const yCoef11 = 93 + yGap;
  const yCoef12 = 12 + yGap;
  const yCoef13 = 81 + yGap;

  const xGap = layoutRegion.width - svgWidth - gap;
  const xCoef1 = 162 + xGap;
  const xCoef2 = 156.627 + xGap;
  const xCoef3 = 160.475 + xGap;
  const xCoef4 = 158.481 + xGap;
  const xCoef5 = 137.948 + xGap;
  const xCoef6 = 121.763 + xGap;
  const xCoef7 = 117.887 + xGap;

  const xCoef8 = 117.51 + xGap;
  const xCoef9 = 115.82 + xGap;
  const xCoef10 = 113.791 + xGap;
  const xCoef11 = 150 + xGap;

  /*
  Original SVG
  <path d="
  M0 12
  C0 5.37258 5.37258 0 12 0
  H150
  C156.627 0 162 5.37258 162 12
  V44.7906
  C162 46.8196 160.475 48.5104 158.481 48.8868
  C137.948 52.7633 121.763 68.9476 117.887 89.481
  C117.51 91.4748 115.82 93 113.791 93
  H12
  C5.37259 93 0 87.6274 0 81
  V12Z" fill="black"/>
   */
  const svgData = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 12
         C0 5.37258 5.37258 0 12 0
         H${xCoef11}
         C${xCoef2} 0 ${xCoef1} 5.37258 ${xCoef1} 12
         V${yCoef10}
         C${xCoef1} ${yCoef7} ${xCoef3} ${yCoef8} ${xCoef4} ${yCoef9}
         C${xCoef5} ${yCoef6} ${xCoef6} ${yCoef4} ${xCoef7} ${yCoef3}
         C${xCoef8} ${yCoef2} ${xCoef9} ${yCoef11} ${xCoef10} ${yCoef11}
         H${yCoef12}
         C5.37259 ${yCoef11} 0 ${yCoef5} 0 ${yCoef13}
         V${yCoef12}Z"
      fill="white"/>
</svg>`;

  const svg = Skia.SVG.MakeFromString(svgData);

  const onLayout = (data: LayoutChangeEvent) => {
    setLayoutRegion({
      width: data.nativeEvent.layout.width,
      height: data.nativeEvent.layout.height,
    });
  };

  const ref = useCanvasRef();

  const opacityValue = useSharedValue(defaultOpacity);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacityValue.value,
      transform: [{ scaleX: isLeft ? 1 : -1 }, { scaleY: isTop ? 1 : -1 }],
    };
  }, [opacityValue]);

  const easing = Easing.inOut(Easing.ease);

  const onFade = () => {
    opacityValue.value = withSequence(
      withTiming(pressOpacity, {
        duration: animationDuration,
        easing,
      }),
      withTiming(defaultOpacity, {
        duration: animationDuration,
        easing,
      }),
    );
  };

  const isPlural = useAnimatedTextToPluralValue(count);

  return (
    <View style={styles.item} onLayout={onLayout}>
      <Animated.View
        style={[styles.svgContainer, animatedStyle]}
        onLayout={onLayout}
      >
        <Pressable
          onPressIn={onFade}
          onPressOut={onPress}
          style={styles.pressableContainer}
        >
          <Canvas style={styles.svgCanvas} ref={ref}>
            <Group>
              <ImageSVG svg={svg} />
            </Group>
          </Canvas>
        </Pressable>
      </Animated.View>
      <View pointerEvents="none" style={styles.textContainer}>
        <AnimatedText variant="xlarge" text={count} appearance="dark" />
        <Text variant="small" style={styles.text}>
          {renderMessageComponent(isPlural)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    flex: 1,
  },
  text: {
    color: colors.white,
  },
  pressableContainer: { width: '100%', height: '100%' },
  textContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    flex: 1,
    alignItems: 'center',
  },
  svgContainer: { height: '100%', width: '100%' },
  svgCanvas: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});
