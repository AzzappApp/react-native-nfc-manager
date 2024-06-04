import { StyleSheet, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { TOOLBOX_SECTION_HEIGHT } from './ToolBoxSection';

const ToolBarContainer = ({
  visible,
  style,
  destroyOnHide = false,
  ...props
}: ViewProps & { visible: boolean; destroyOnHide?: boolean }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const translation = withTiming(visible ? 0 : TOOLBOX_SECTION_HEIGHT, {
      duration: 300,
    });
    return {
      transform: [{ translateY: translation }],
    };
  }, [visible]);

  return (
    <Animated.View style={[styles.layerContainer, style, animatedStyle]}>
      {visible || !destroyOnHide ? props.children : null}
    </Animated.View>
  );
};

export default ToolBarContainer;

const styles = StyleSheet.create({
  layerContainer: {
    position: 'absolute',
    height: TOOLBOX_SECTION_HEIGHT,
    width: '100%',
  },
});
