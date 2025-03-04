import { useEffect, useRef, useState } from 'react';
import { Pressable, Animated } from 'react-native';
import { colors, shadow, textStyles } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type {
  ViewProps,
  LayoutChangeEvent,
  LayoutRectangle,
} from 'react-native';

type SwitchToggleProps<T> = Omit<ViewProps, 'children'> & {
  values: [{ value: T; label: string }, { value: T; label: string }];
  value: T;
  onChange: (value: T) => void;
};

const SwitchToggle = <T,>({
  value,
  values,
  onChange,
  style,
  ...props
}: SwitchToggleProps<T>) => {
  const index = values[0].value === value ? 0 : 1;
  const animatedValue = useRef(new Animated.Value(index)).current;
  const thumbPressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: index,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [animatedValue, index]);

  const onPressIn = () => {
    Animated.timing(thumbPressAnimation, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(thumbPressAnimation, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const onPress = () => {
    onChange(values[(index + 1) % 2].value);
    onPressOut();
  };

  const [layout, setLayout] = useState<LayoutRectangle | null>(null);

  const onLayout = (event: LayoutChangeEvent) => {
    setLayout(event.nativeEvent.layout);
  };

  const styles = useStyleSheet(styleSheet);

  return (
    <Pressable
      style={[styles.root, style]}
      accessibilityRole="togglebutton"
      accessibilityValue={{
        text: values[index].label,
      }}
      {...props}
      onLayout={onLayout}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      {values.map((item, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.item,
            textStyles.textField,
            {
              opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [index === 0 ? 1 : 0.5, index === 0 ? 0.5 : 1],
              }),
            },
          ]}
        >
          {item.label}
        </Animated.Text>
      ))}

      <Animated.View
        style={[
          styles.thumb,
          layout
            ? {
                transform: [
                  {
                    translateX: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, layout.width / 2],
                    }),
                  },
                  {
                    scale: thumbPressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    }),
                  },
                ],
              }
            : { left: `${index * 50}%` },
        ]}
      />
    </Pressable>
  );
};

export default SwitchToggle;

const styleSheet = createStyleSheet(appearance => ({
  root: {
    flexDirection: 'row',
    height: 35,
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.grey50,
    borderRadius: 20,
  },
  item: {
    flex: 1,
    zIndex: 1,
    textAlign: 'center',
    alignSelf: 'center',
    color: appearance === 'dark' ? colors.white : colors.black,
  },
  thumb: [
    {
      position: 'absolute',
      top: 2,
      height: 31,
      width: '49%',
      borderRadius: 20,
      backgroundColor: appearance === 'dark' ? colors.black : colors.white,
    },
    shadow({ appearance, direction: 'center' }),
  ],
}));
