import { useMemo, useRef, useState } from 'react';
import { Image, PixelRatio, StyleSheet } from 'react-native';
import type { ImageProps, LayoutChangeEvent } from 'react-native';

type ResponsiveImageProps = Omit<ImageProps, 'source'> & {
  uri: string;
};

type Dimensions = {
  width: number;
  height: number;
};

const ResponsiveImage = ({ uri, style, ...props }: ResponsiveImageProps) => {
  const isCloudinaryURl = !uri.startsWith('http');
  const [measuredDimensions, setMeasuredDimension] =
    useState<Dimensions | null>(null);

  const { width: styleWidth, height: styleHeight } = StyleSheet.flatten(style);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (
      width !== measuredDimensions?.width ||
      height !== measuredDimensions?.height
    ) {
      setMeasuredDimension({ width, height });
    }
  };

  const previousUsedDimensions = useRef<Dimensions | null>(null);

  const computedUri = useMemo(() => {
    if (!isCloudinaryURl) {
      return uri;
    } else {
      let dimensions =
        typeof styleWidth === 'number' && typeof styleHeight === 'number'
          ? { width: styleWidth, height: styleHeight }
          : measuredDimensions != null
          ? measuredDimensions
          : previousUsedDimensions.current;

      if (dimensions) {
        if (previousUsedDimensions.current) {
          if (
            previousUsedDimensions.current.width >= dimensions.width &&
            previousUsedDimensions.current.height >= dimensions.height
          ) {
            dimensions = previousUsedDimensions.current;
          }
        }

        previousUsedDimensions.current = dimensions;

        const width = PixelRatio.getPixelSizeForLayoutSize(dimensions.width);
        const height = PixelRatio.getPixelSizeForLayoutSize(dimensions.height);
        const transform = `c_fill,w_${Math.ceil(width)},h_${Math.ceil(height)}`;

        return `https://res.cloudinary.com/azzapp/${transform}/${uri}`;
      }
    }
  }, [isCloudinaryURl, measuredDimensions, styleHeight, styleWidth, uri]);

  const source = computedUri ? { uri: computedUri } : null;
  return (
    <Image
      {...props}
      onLayout={onLayout}
      style={[style, !source && { backgroundColor: '#D0D0D0' }]}
      source={source as any}
    />
  );
};

export default ResponsiveImage;
