import { Fragment, useEffect, useState } from 'react';
import { StyleSheet, useColorScheme, useWindowDimensions } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '#theme';
import type { StyleProp, ViewStyle } from 'react-native';

type InnerModalProps = {
  visible: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const InnerModal = ({ visible, children, style }: InnerModalProps) => {
  const visibleSharedValue = useSharedValue(visible ? 1 : 0);

  const [showChildren, setShowChildren] = useState(visible);
  const [key, setKey] = useState(0);
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    let canceled = false;
    const onEnd = () => {
      if (!canceled && !visible) {
        setShowChildren(visible);
        setKey(prev => prev + 1);
      }
    };
    if (visible) {
      setShowChildren(true);
    }
    visibleSharedValue.value = withTiming(
      visible ? 1 : 0,
      { duration: 220 },
      () => {
        runOnJS(onEnd)();
      },
    );
    return () => {
      canceled = true;
    };
  }, [visible, visibleSharedValue]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: (1 - visibleSharedValue.value) * windowHeight,
        },
      ],
    };
  }, [windowHeight]);

  const appearance = useColorScheme();

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        !showChildren && { display: 'none' },
        {
          backgroundColor: appearance === 'dark' ? colors.black : colors.white,
        },
        animatedStyle,
        style,
      ]}
    >
      <Fragment key={key}>{children}</Fragment>
    </Animated.View>
  );
};

export default InnerModal;
