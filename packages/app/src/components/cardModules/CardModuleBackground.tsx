import chroma from 'chroma-js';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
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

  return (
    <View style={[{ opacity: layout ? 1 : 0 }, style]} onLayout={onLayout}>
      {children}
      {layout && (
        <View
          style={{
            position: 'absolute',
            zIndex: -1,
            backgroundColor,
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
          }}
          pointerEvents="none"
        >
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
