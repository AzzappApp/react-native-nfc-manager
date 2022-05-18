import { timeout } from '@azzapp/shared/lib/asyncHelpers';
import {
  COVER_BASE_WIDTH,
  getCoverURLForSize,
  getMostAdaptedCoverSizeForWidth,
} from '@azzapp/shared/lib/imagesFormats';
import { useEffect, useState } from 'react';
import { Animated, Image, PixelRatio, useWindowDimensions } from 'react-native';
import type { ImageSourcePropType, ImageProps } from 'react-native';

type CoverRendererImageProps = Omit<
  Animated.AnimatedProps<ImageProps>,
  'source'
> & {
  picture: string;
  useLargeImage?: boolean;
};

const CoverRendererImage = ({
  picture,
  useLargeImage,
  onLoad,
  style,
  ...props
}: CoverRendererImageProps) => {
  const [imageSource, setImageSource] = useState<ImageSourcePropType | null>();

  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    let canceled = false;
    const smallUri = getCoverURLForSize(
      getMostAdaptedCoverSizeForWidth(
        PixelRatio.getPixelSizeForLayoutSize(COVER_BASE_WIDTH),
      ),
      picture,
    );

    const largeURI = getCoverURLForSize(
      getMostAdaptedCoverSizeForWidth(
        PixelRatio.getPixelSizeForLayoutSize(windowWidth),
      ),
      picture,
    );

    const loadUri = async (attempt = 0) => {
      if (canceled) {
        return;
      }
      try {
        const loadedQueries =
          (await Image.queryCache?.([smallUri, largeURI]).catch(() => ({}))) ??
          {};

        if (canceled) {
          return;
        }

        const setOrPrefetchImage = async (
          image: string,
          alternative: string,
        ) => {
          if (loadedQueries[image]) {
            setImageSource({ uri: image });
            return;
          }

          if (loadedQueries[alternative]) {
            setImageSource({ uri: alternative });
          }

          const prefetched = await Image.prefetch(image);
          if (canceled) {
            return;
          }
          if (prefetched) {
            setImageSource({ uri: image });
          }
        };

        if (useLargeImage) {
          await setOrPrefetchImage(largeURI, smallUri);
        } else {
          await setOrPrefetchImage(smallUri, largeURI);
        }
      } catch (e) {
        if (attempt < 3) {
          await timeout(TIMEOUTS[attempt]);
          await loadUri(attempt + 1);
        }
        throw e;
      }
    };

    void loadUri();

    return () => {
      canceled = true;
    };
  }, [picture, useLargeImage, windowWidth]);

  return (
    <Animated.Image
      {...props}
      source={imageSource!}
      style={style}
      onLoad={onLoad}
    />
  );
};

export default CoverRendererImage;

const TIMEOUTS = [1000, 3000, 10000];
