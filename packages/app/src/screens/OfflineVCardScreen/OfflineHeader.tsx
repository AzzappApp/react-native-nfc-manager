import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { colors } from '#theme';
import AnimatedText from '#components/AnimatedText';
import {
  PROFILE_LINK_HEIGHT,
  PROFILE_LINK_MARGIN_TOP,
} from '#screens/HomeScreen/HomeProfileLink';
import type { SharedValue } from 'react-native-reanimated';

type OfflineHeaderProps = {
  userNames: string[];
  currentIndexSharedValue: SharedValue<number>;
};
const OfflineHeader = ({
  userNames,
  currentIndexSharedValue,
}: OfflineHeaderProps) => {
  const maxLength = useWindowDimensions().width / 13;

  const animatedUserNames = useDerivedValue(() => {
    'worklet';
    return userNames.map(p => {
      'worklet';
      return '/' + p;
    });
  }, [userNames]);
  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity:
        1 -
        currentIndexSharedValue.value +
        Math.round(currentIndexSharedValue.value),
    };
  });

  const text = useDerivedValue(() => {
    return animatedUserNames.value[Math.round(currentIndexSharedValue.value)];
  });

  return (
    <Animated.View style={[styles.container, opacityStyle]}>
      <View style={styles.containerText}>
        <AnimatedText
          variant="button"
          numberOfLines={1}
          style={styles.url}
          text={text}
          maxLength={maxLength}
        />
      </View>
    </Animated.View>
  );
};

export default OfflineHeader;

const styles = StyleSheet.create({
  container: {
    height: PROFILE_LINK_HEIGHT,
    alignItems: 'center',
    marginTop: PROFILE_LINK_MARGIN_TOP,
  },
  url: {
    color: colors.white,
    padding: 5,
  },
  containerText: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
});
