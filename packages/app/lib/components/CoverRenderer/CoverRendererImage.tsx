import { timeout } from '@azzapp/shared/lib/asyncHelpers';
import { useEffect, useState } from 'react';
import { Animated, Image } from 'react-native';
import Fade from '../Fade';
import type { ImageSourcePropType, ImageProps } from 'react-native';

type CoverRendererImageProps = Omit<ImageProps, 'source'> & {
  source: string;
  largeURI: string;
  smallURI: string;
  useLargeImage?: boolean;
  hidden?: boolean;
};

const CoverRendererImage = ({
  largeURI,
  smallURI,
  useLargeImage,
  hidden,
  style,
  ...props
}: CoverRendererImageProps) => {
  const [imageSource, setImageSource] = useState<ImageSourcePropType | null>();

  useEffect(() => {
    let canceled = false;

    const loadUri = async (attempt = 0) => {
      if (canceled) {
        return;
      }
      try {
        const loadedQueries =
          (await Image.queryCache?.([largeURI, smallURI]).catch(() => ({}))) ??
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
          await setOrPrefetchImage(largeURI, smallURI);
        } else {
          await setOrPrefetchImage(smallURI, largeURI);
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
  }, [largeURI, smallURI, useLargeImage]);

  return (
    <Fade hidden={hidden}>
      <Animated.Image {...props} source={imageSource!} style={style} />
    </Fade>
  );
};

export default CoverRendererImage;

const TIMEOUTS = [1000, 3000, 10000];
