import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Defs, Pattern, Rect, Svg, SvgUri } from 'react-native-svg';
import type { CardModuleBackgroundImageProps } from './types';
import type { ViewStyle, StyleProp, LayoutChangeEvent } from 'react-native';
import type { PatternProps, UriProps } from 'react-native-svg';

type Size = {
  width: number;
  height: number;
};

const CardModuleBackgroundImageSvg = (
  props: CardModuleBackgroundImageProps,
) => {
  const { layout, resizeMode, backgroundUri, patternColor, backgroundOpacity } =
    props;

  const [svgSize, setSvgSize] = useState<Size | null>(null);

  const handleSvgLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      if (width && height && !svgSize) setSvgSize({ width, height });
    },
    [svgSize],
  );

  const [svg, style, pattern] = useMemo(() => {
    const svgProps: Omit<UriProps, 'uri'> = { style: {} };
    const containerStyle: StyleProp<ViewStyle> = {};
    const patternProps: PatternProps = {};

    const width = layout?.width ?? 0;
    const height = layout?.height ?? 0;

    if (resizeMode === 'cover' && svgSize) {
      svgProps.width = '100%';
      svgProps.height = '100%';
      containerStyle.justifyContent = 'center';
      containerStyle.alignItems = 'center';
    }

    if (resizeMode === 'contain' && svgSize) {
      if (width > height) {
        const ratio = svgSize.width / svgSize.height;

        svgProps.height = height;
        svgProps.width = height * ratio;
      } else {
        const ratio = svgSize.height / svgSize.width;

        svgProps.height = width * ratio;
        svgProps.width = width;
      }
    }

    if (['center', 'contain', 'stretch'].includes(resizeMode!)) {
      containerStyle.justifyContent = 'center';
      containerStyle.alignItems = 'center';
    }

    if (resizeMode === 'repeat' && svgSize) {
      patternProps.width = svgSize.width;
      patternProps.height = svgSize.height;
    }

    if (resizeMode === 'stretch' && svgSize && width && height) {
      svgProps.style = {
        transform: [
          {
            scaleX: width / svgSize.width,
          },
          {
            scaleY: height / svgSize.height,
          },
        ],
      };
    }

    return [svgProps, containerStyle, patternProps];
  }, [layout, resizeMode, svgSize]);

  if (!backgroundUri) return null;

  if (resizeMode === 'repeat') {
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
            patternUnits="userSpaceOnUse"
            x="0"
            y="0"
          >
            <SvgUri
              onLayout={handleSvgLayout}
              {...svg}
              uri={backgroundUri}
              style={{ opacity: backgroundOpacity }}
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
        onLayout={handleSvgLayout}
        {...svg}
        uri={backgroundUri}
        color={patternColor ?? '#000'}
        preserveAspectRatio="xMidYMid slice"
        style={[
          {
            opacity: backgroundOpacity,
          },
          svg.style,
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
    pointerEvents: 'none',
    zIndex: -1,
  },
});

export default CardModuleBackgroundImageSvg;
