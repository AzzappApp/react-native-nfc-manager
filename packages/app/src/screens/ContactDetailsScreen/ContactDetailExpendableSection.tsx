import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '#theme';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import type { LayoutChangeEvent } from 'react-native';

const BUTTON_OFFSET = 50;

export const ContactDetailExpendableSection = ({
  children,
  minHeight,
}: {
  children: JSX.Element;
  minHeight: number;
}) => {
  const intl = useIntl();
  const moreLabel = intl.formatMessage({
    defaultMessage: 'Show more',
    description: 'more button in collapsable item',
  });
  const lessLabel = intl.formatMessage({
    defaultMessage: 'Show less',
    description: 'less button in collapsable item',
  });

  const [height, setHeight] = useState(minHeight ?? 0);
  const [buttonLabel, setButtonLabel] = useState(moreLabel);

  const expendAnimation = useSharedValue(0);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const realHeight = event.nativeEvent.layout.height;
      setHeight(realHeight);
      if (realHeight < minHeight) {
        expendAnimation.set(1);
      }
    },
    [expendAnimation, minHeight],
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: expendAnimation.value * (height - minHeight) + minHeight,
      overflow: 'hidden',
    };
  });

  const opacityAnimationStyle = useAnimatedStyle(() => {
    return {
      opacity: expendAnimation.value,
      position: 'absolute',
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: (1 - expendAnimation.value) * -BUTTON_OFFSET,
        },
      ],
    };
  });

  const onPress = useCallback(() => {
    expendAnimation.set(
      withTiming(1 - expendAnimation.value, { duration: 500 }),
    );
  }, [expendAnimation]);

  const updateLabel = useCallback(
    (value: number) => {
      if (value === 1) {
        setButtonLabel(lessLabel);
      } else if (value === 0) {
        setButtonLabel(moreLabel);
      }
    },
    [lessLabel, moreLabel],
  );

  useAnimatedReaction(
    () => expendAnimation.value,
    value => {
      runOnJS(updateLabel)(value);
    },
  );

  return (
    <>
      <Animated.View style={animatedStyle}>
        {/* this invisible is used to get children size <MaskedView/> breaks
        initial implementation and doesn't seems to manage layout dynamically correctly */}
        <Animated.View onLayout={onLayout} style={opacityAnimationStyle}>
          {children}
        </Animated.View>
        <MaskedView
          style={styles.flex}
          maskElement={
            <MaskedView style={styles.flex} maskElement={children}>
              <LinearGradient
                colors={['#000000FF', '#00000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                locations={[0.3, 1]}
                style={styles.gradient}
              />
            </MaskedView>
          }
        >
          <LinearGradient
            colors={['#0000000FF', '#00000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            locations={[0.3, 1]}
            style={styles.gradient}
          >
            {children}
          </LinearGradient>
        </MaskedView>
      </Animated.View>

      {height > minHeight && (
        <Animated.View style={buttonStyle}>
          <RoundedMenuComponent
            id={null}
            style={styles.button}
            textStyle={styles.buttonText}
            onSelect={onPress}
            label={buttonLabel}
          />
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.black,
    height: 50,
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
  buttonText: { color: colors.grey50 },
  gradient: {
    flex: 1,
    width: '100%',
  },
  flex: { flex: 1 },
});
