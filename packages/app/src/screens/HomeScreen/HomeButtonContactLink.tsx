import {
  Canvas,
  fitbox,
  Group,
  ImageSVG,
  rect,
  useCanvasRef,
  useSVG,
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
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '#theme';
import AnimatedText from '#components/AnimatedText';
import Text from '#ui/Text';
import type { DataSourceParam } from '@shopify/react-native-skia';
import type { LayoutChangeEvent } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type HomeButtonContactLinkProps = {
  svgFile: DataSourceParam;
  count: SharedValue<string>;
  onPress?: () => void;
  isLeft?: boolean;
  isTop?: boolean;
  renderMessageComponent: (isPlural: number) => JSX.Element;
};

export const HomeButtonContactLink = ({
  svgFile,
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

  const svg = useSVG(svgFile);

  const [layoutRegion, setLayoutRegion] = useState({ height: 0, width: 0 });

  const widthMargin = isLeft ? 0 : gap;
  const heightMargin = isTop ? 0 : gap;

  const src = rect(0, 0, svg?.width() || 0, svg?.height() || 0);
  const dst = rect(
    widthMargin,
    heightMargin,
    layoutRegion.width,
    layoutRegion.height,
  );

  const onLayout = (data: LayoutChangeEvent) => {
    const widthGap = -gap;
    const heightGap = -gap;

    setLayoutRegion({
      width: data.nativeEvent.layout.width + widthGap,
      height: data.nativeEvent.layout.height + heightGap,
    });
  };

  const ref = useCanvasRef();

  const opacityValue = useSharedValue(defaultOpacity);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacityValue.value,
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

  const [isPlural, setIsPlural] = useState(1);

  useAnimatedReaction(
    () => parseInt(count.value, 10) > 1,
    _isPlural => {
      runOnJS(setIsPlural)(_isPlural ? 1 : 0);
    },
    [],
  );

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
            <Group transform={fitbox('fill', src, dst)}>
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
