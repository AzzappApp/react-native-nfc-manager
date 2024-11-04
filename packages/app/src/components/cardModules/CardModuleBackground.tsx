import chroma from 'chroma-js';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors } from '#theme';
import CardModuleBackgroundImage from './CardModuleBackgroundImage';
import type {
  LayoutChangeEvent,
  LayoutRectangle,
  ViewProps,
} from 'react-native';

type CardModuleBackgroundProps = ViewProps & {
  backgroundUri?: string | null;
  backgroundColor?: string | null;
  backgroundOpacity?: number | null;
  patternColor?: string | null;
  resizeMode?: string | null;
};

const CardModuleBackground = ({
  backgroundUri,
  backgroundColor,
  backgroundOpacity,
  patternColor,
  resizeMode,
  children,
  style,
  ...props
}: CardModuleBackgroundProps) => {
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      props.onLayout?.(e);
      setLayout(e.nativeEvent.layout);
    },
    [props],
  );

  backgroundOpacity = (backgroundOpacity ?? 100) / 100;
  backgroundColor = backgroundColor
    ? chroma(backgroundColor).alpha(backgroundOpacity).hex()
    : colors.white;

  const backgroundImageStyle = useMemo(
    () =>
      backgroundColor
        ? [styles.background, { backgroundColor }]
        : styles.background,
    [backgroundColor],
  );
  return (
    <View style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
      <Animated.View
        {...props}
        style={[{ opacity: layout ? 1 : 0 }, style]}
        onLayout={onLayout}
      >
        {children}
      </Animated.View>
      {layout && (
        <View style={backgroundImageStyle} pointerEvents="none">
          <CardModuleBackgroundImage
            backgroundOpacity={backgroundOpacity}
            backgroundUri={backgroundUri}
            layout={layout}
            patternColor={patternColor}
            resizeMode={resizeMode}
          />
        </View>
      )}
    </View>
  );
};

export default CardModuleBackground;

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    flex: 1,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
});
