import {
  getCoverURLForSize,
  getMostAdaptedCoverSizeForWidth,
} from '@azzapp/shared/lib/imagesFormats';
import { useEffect, useState } from 'react';
import {
  Image,
  PixelRatio,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import type { ImageSourcePropType, ImageProps } from 'react-native';

type CoverRendererImageProps = Omit<ImageProps, 'source'> & {
  picture: string | null | undefined;
  useLargeImage?: boolean;
};

const CoverRendererImage = ({
  picture,
  useLargeImage,
  style,
  ...props
}: CoverRendererImageProps) => {
  const [imageSource, setImageSource] = useState<ImageSourcePropType | null>();

  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    let canceled = false;
    const loadUri = async () => {
      if (picture) {
        const smallUri = getCoverURLForSize(
          getMostAdaptedCoverSizeForWidth(
            PixelRatio.getPixelSizeForLayoutSize(125),
          ),
          picture,
        );
        const largeURI = getCoverURLForSize(
          getMostAdaptedCoverSizeForWidth(
            PixelRatio.getPixelSizeForLayoutSize(windowWidth),
          ),
          picture,
        );
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
          } else if (loadedQueries[alternative]) {
            setImageSource({ uri: alternative });
          }
          const prefetched = await Image.prefetch(image).catch(() => false);
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
      }
    };
    void loadUri().catch(() => void 0);
    return () => {
      canceled = true;
    };
  }, [picture, useLargeImage, windowWidth]);

  return (
    <Image
      {...props}
      source={imageSource!}
      style={[style, styles.coverImage]}
    />
  );
};

export default CoverRendererImage;

const styles = StyleSheet.create({
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#D0D0D0',
  },
});
