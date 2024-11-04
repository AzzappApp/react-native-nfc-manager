import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableNative from '#ui/PressableNative';
import type {
  LayoutChangeEvent,
  LayoutRectangle,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native';

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
  onLayout: onLayoutProp,
  children,
  moduleContainerStyle,
  style,
  ...props
}: EditorScaledPreviewProps) => {
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayoutProp?.(event);
      setLayout(event.nativeEvent.layout);
    },
    [onLayoutProp],
  );

  const [moduleContainerLayout, setModuleContainerLayout] =
    useState<LayoutRectangle | null>(null);

  const onModuleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setModuleContainerLayout(event.nativeEvent.layout);
  }, []);

  const scale =
    layout && moduleContainerLayout
      ? Math.min(layout.height / moduleContainerLayout?.height, 1)
      : 1;

  const styles = useStyleSheet(styleSheet);

  return (
    <View {...props} style={style} onLayout={onLayout}>
      <PressableNative
        onPress={onPreviewPress}
        onLayout={onModuleContainerLayout}
        disabledOpacity={onPreviewPress != null ? 0.3 : 1}
        disabled={onPreviewPress == null}
        style={[
          styles.moduleContainer,
          {
            opacity: layout ? 1 : 0,
            top:
              layout && moduleContainerLayout
                ? layout.height / 2 - moduleContainerLayout.height / 2
                : 0,
            left:
              layout && moduleContainerLayout
                ? layout.width / 2 - moduleContainerLayout.width / 2
                : 0,
            transform: layout ? [{ scale }] : undefined,
          },
          moduleContainerStyle,
        ]}
      >
        {children}
      </PressableNative>
    </View>
  );
};

export default EditorScaledPreview;

const styleSheet = createStyleSheet(apperance => ({
  moduleContainer: [
    {
      position: 'absolute',
      width: '100%',
      backgroundColor: colors.white,
    },
    shadow(apperance),
  ],
}));
