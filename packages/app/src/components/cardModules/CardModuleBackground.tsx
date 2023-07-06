import chroma from 'chroma-js';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { colors } from '#theme';
import type { LayoutChangeEvent, LayoutRectangle } from 'react-native';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type CardModuleBackgroundProps = ViewProps & {
  backgroundUri?: string | null;
  backgroundColor?: string | null;
  backgroundOpacity?: number | null;
  patternColor?: string | null;
};

const CardModuleBackground = ({
  backgroundUri,
  backgroundColor,
  backgroundOpacity,
  patternColor,
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

  return (
    <View
      {...props}
      style={[{ opacity: layout ? 1 : 0, backgroundColor }, style]}
      onLayout={onLayout}
    >
      {backgroundUri && (
        <View style={styles.background} pointerEvents="none">
          <SvgUri
            uri={backgroundUri}
            color={patternColor ?? '#000'}
            width={layout?.width ?? 0}
            height={layout?.height ?? 0}
            preserveAspectRatio="xMidYMid slice"
            style={{ opacity: backgroundOpacity }}
          />
        </View>
      )}
      {children}
    </View>
  );
};

export default CardModuleBackground;

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
});
