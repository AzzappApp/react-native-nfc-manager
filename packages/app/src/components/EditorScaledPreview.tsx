import {
  View,
  type LayoutRectangle,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  measure,
  useAnimatedRef,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableOpacity from '#ui/PressableOpacity';

type EditorScaledPreviewProps = ViewProps & {
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;

  /**
   * style of the inner module container
   */
  moduleContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * A component that wraps the module preview and scales it to fit his size.
 */
const EditorScaledPreview = ({
  onPreviewPress,
  onLayout,
  children,
  moduleContainerStyle,
  style,
  ...props
}: EditorScaledPreviewProps) => {
  const styles = useStyleSheet(styleSheet);

  const containerRef = useAnimatedRef();

  const containerValue = useSharedValue<LayoutRectangle | null>(null);

  const moduleRef = useAnimatedRef();

  const moduleLayout = useSharedValue<LayoutRectangle | null>(null);

  useFrameCallback(() => {
    const containerSize = measure(containerRef);
    if (containerSize) {
      containerValue.value = containerSize;
    }

    const moduleSize = measure(moduleRef);
    if (moduleSize) {
      moduleLayout.value = moduleSize;
    }
  });

  const scaledViewAnimatedStyle = useAnimatedStyle(() => {
    const scale =
      containerValue.value && moduleLayout.value
        ? Math.min(containerValue.value.height / moduleLayout.value.height, 1)
        : 1;

    return {
      opacity: containerValue.value ? 1 : 0,
      top:
        containerValue.value && moduleLayout.value
          ? containerValue.value.height / 2 - moduleLayout.value.height / 2
          : 0,
      left:
        containerValue.value && moduleLayout.value
          ? containerValue.value.width / 2 - moduleLayout.value.width / 2
          : 0,
      transform: containerValue.value ? [{ scale }] : undefined,
    };
  });

  return (
    <Animated.View
      {...props}
      onLayout={onLayout}
      style={style}
      ref={containerRef}
    >
      <Animated.View
        ref={moduleRef}
        style={[styles.moduleContainer, moduleContainerStyle]}
      >
        <Animated.View style={scaledViewAnimatedStyle}>
          <View style={styles.previewContainer}>
            <PressableOpacity
              onPress={onPreviewPress}
              disabledOpacity={onPreviewPress != null ? 0.3 : 1}
              disabled={onPreviewPress == null}
            >
              {children}
            </PressableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

export default EditorScaledPreview;

const styleSheet = createStyleSheet(appearance => ({
  moduleContainer: {
    position: 'absolute',
    width: '100%',
  },
  previewContainer: {
    backgroundColor: colors.white,
    ...shadow({ appearance }),
  },
}));
