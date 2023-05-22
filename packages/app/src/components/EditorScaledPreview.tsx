import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '#theme';
import PressableNative from '#ui/PressableNative';
import type {
  LayoutChangeEvent,
  LayoutRectangle,
  StyleProp,
  ViewStyle,
} from 'react-native';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type EditorScaledPreviewProps = ViewProps & {
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress: () => void;

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

  return (
    <View {...props} style={style} onLayout={onLayout}>
      <PressableNative
        onPress={onPreviewPress}
        onLayout={onModuleContainerLayout}
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

const styles = StyleSheet.create({
  moduleContainer: {
    position: 'absolute',
    width: '100%',
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOpacity: 0.42,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 17,
  },
});
