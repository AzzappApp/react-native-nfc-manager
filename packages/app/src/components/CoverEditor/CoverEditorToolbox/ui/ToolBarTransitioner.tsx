import { useEffect } from 'react';
import { Platform, StyleSheet, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { TOOLBOX_SECTION_HEIGHT } from './ToolBoxSection';

const ToolBarContainer = ({
  visible,
  style,
  destroyOnHide = false,
  ...props
}: ViewProps & { visible: boolean; destroyOnHide?: boolean }) => {
  const translation = useSharedValue(visible ? 0 : TOOLBOX_SECTION_HEIGHT);
  useEffect(() => {
    translation.value = withTiming(visible ? 0 : TOOLBOX_SECTION_HEIGHT, {
      duration: 300,
    });
  }, [translation, visible]);

  const animatedStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'android') {
      // see @https://github.com/facebook/react-native/issues/44768
      return {
        top: translation.value,
      };
    }
    return {
      transform: [{ translateY: translation.value }],
    };
  });

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
    left: 0,
    top: 0,
  },
});
