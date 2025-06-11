import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '#theme';
import Text from '#ui/Text';
import AnimatedText from './AnimatedText';
import { useCoverUpload } from './CoverEditor/CoverUploadContext';

const SIZE = 90;
const INNER_WIDTH = 3;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CoverRendererUploadingProgress = () => {
  const barWidth = (SIZE * 10) / 100;
  const radius = SIZE / 2 - barWidth + INNER_WIDTH / 2;
  const circumference = 2 * Math.PI * radius;
  const { progress } = useCoverUpload();
  // Shared value for animated progress
  const progressValue = useSharedValue(0);
  // Update progress value when `progress` prop changes
  useEffect(() => {
    progressValue.value = withTiming(progress / 100, {
      duration: 1000,
      easing: Easing.linear,
    });
  }, [progress, progressValue]);

  // Animated props for the progress circle
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressValue.value),
  }));

  // Derived value for animated text
  const animatedText = useDerivedValue(() => {
    return `${Math.round(progressValue.value * 100)}%`;
  });

  return (
    <BlurView
      intensity={40}
      tint="dark"
      style={[
        { width: SIZE, height: SIZE, borderRadius: SIZE / 2 },

        // eslint-disable-next-line react-native/no-color-literals
        {
          boxSizing: 'content-box',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.4)',
          borderCurve: 'continuous',
        },
      ]}
    >
      <Svg
        testID="progress-circle"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ transform: [{ rotateZ: '270deg' }] }}
      >
        <Circle
          cx="50%" //centerX
          cy="50%" //centerX
          r={SIZE / 2 - barWidth + INNER_WIDTH / 2} //r is witout stroke widith
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth={barWidth}
          fill="transparent" //rgba(0, 0, 0, 0.3)"
        />
        {/* Animated Progress Circle */}
        <AnimatedCircle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="#FFFFFF"
          strokeWidth={barWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="square"
          fill="transparent"
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          width: SIZE,
          height: SIZE,
        }}
      >
        <Text style={{ color: colors.white, fontSize: 7 }}>
          <FormattedMessage
            defaultMessage="Uploading"
            description="Cover Upload progress message"
          />
        </Text>
        <AnimatedText
          variant="xlarge"
          style={{
            color: colors.white,
            fontSize: 16,
            fontWeight: 'bold',
          }}
          text={animatedText}
        />
      </View>
    </BlurView>
  );
};
export default CoverRendererUploadingProgress;
