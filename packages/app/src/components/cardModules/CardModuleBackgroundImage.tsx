import { useMemo, useState } from 'react';
import {
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Defs, Pattern, Rect, Svg, SvgUri } from 'react-native-svg';
import type { PatternProps, UriProps } from 'react-native-svg';

type CardModuleBackgroundImageProps = {
  layout: { width?: number; height?: number } | null;
  resizeMode: string | null | undefined;
  backgroundUri: string | null | undefined;
  patternColor: string | null | undefined;
  backgroundOpacity: number;
};

type Size = {
  width: number;
  height: number;
};

const CardModuleBackgroundImage = (props: CardModuleBackgroundImageProps) => {
  const { layout, resizeMode, backgroundUri, patternColor, backgroundOpacity } =
    props;

  const [svgSize, setSvgSize] = useState<Size | null>(null);

  const handleSvgLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width && height) setSvgSize({ width, height });
  };

  const [svg, style, pattern] = useMemo(() => {
    const svgProps: Omit<UriProps, 'uri'> = {};
    const containerStyle: StyleProp<ViewStyle> = {};
    const patternProps: PatternProps = {};

    const width = layout?.width ?? 0;
    const height = layout?.height ?? 0;

    if (resizeMode === 'cover') {
      const size = Math.max(width, height);
      svgProps.width = size;
      svgProps.height = size;
      containerStyle.justifyContent = 'center';
      containerStyle.alignItems = 'center';
    }

    if (resizeMode === 'contain' || resizeMode === 'stretch') {
      const size = Math.min(width, height);
      svgProps.width = size;
      svgProps.height = size;
    }

    if (resizeMode === 'center' || resizeMode === 'contain') {
      containerStyle.justifyContent = 'center';
      containerStyle.alignItems = 'center';
    }

    if (resizeMode === 'repeat' && svgSize) {
      patternProps.width = `${svgSize.width}px`;
      patternProps.height = `${svgSize.height}px`;
    }

    if (resizeMode === 'stretch' && svgSize) {
      patternProps.width = `${svgSize.width}px`;
      patternProps.height = `${svgSize.height}px`;
    }

    return [svgProps, containerStyle, patternProps];
  }, [layout?.width, layout?.height, resizeMode, svgSize]);

  if (!backgroundUri) return null;

  if (resizeMode === 'repeat' || resizeMode === 'stretch') {
    return (
      <Svg
        width="100%"
        height="100%"
        key={`${layout?.height}-${layout?.width}`}
      >
        <Defs>
          <Pattern
            {...pattern}
            id="BackgroundPattern"
            patternUnits="objectBoundingBox"
            x="0"
            y="0"
          >
            <SvgUri
              onLayout={handleSvgLayout}
              {...svg}
              uri={backgroundUri}
              style={[{ opacity: backgroundOpacity }]}
              color={patternColor ?? '#000'}
            />
          </Pattern>
        </Defs>
        <Rect fill="url(#BackgroundPattern)" width="100%" height="100%" />
      </Svg>
    );
  }

  return (
    <View style={[styles.background, style]} pointerEvents="none">
      <SvgUri
        {...svg}
        uri={backgroundUri}
        color={patternColor ?? '#000'}
        preserveAspectRatio="xMidYMid slice"
        style={[
          {
            opacity: backgroundOpacity,
          },
        ]}
      />
    </View>
  );
};

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

export default CardModuleBackgroundImage;
