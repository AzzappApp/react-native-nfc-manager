import { timeout } from '@azzapp/shared/lib/asyncHelpers';
import {
  COVER_BASE_WIDTH,
  getCoverURLForSize,
  getCoverVideoURLFor,
  getMostAdaptedCoverSizeForWidth,
} from '@azzapp/shared/lib/imagesFormats';
import { useEffect, useState } from 'react';
import { Animated, Image, PixelRatio, useWindowDimensions } from 'react-native';
import Video from 'react-native-video';
import type { MediaKind } from '@azzapp/relay/artifacts/CoverRenderer_cover.graphql';
import type { ImageSourcePropType, ImageProps } from 'react-native';
import type { VideoProperties } from 'react-native-video';

type CommonPartial<A, B> = {
  [K in keyof A & keyof B]?: A[K] extends B[K] ? A[K] : never;
};

type CoverRendererImageProps = Omit<
  Animated.AnimatedProps<CommonPartial<ImageProps, VideoProperties>>,
  'source'
> & {
  picture: Readonly<{ source: string; kind: MediaKind }>;
  useLargeImage?: boolean;
};

const CoverRendererImage = ({
  picture: { source, kind },
  useLargeImage,
  style,
  ...props
}: CoverRendererImageProps) => {
  const [imageSource, setImageSource] = useState<ImageSourcePropType | null>();

  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    if (kind !== 'picture') {
      return;
    }
    let canceled = false;
    const smallUri = getCoverURLForSize(
      getMostAdaptedCoverSizeForWidth(
        PixelRatio.getPixelSizeForLayoutSize(COVER_BASE_WIDTH),
      ),
      source,
    );

    const largeURI = getCoverURLForSize(
      getMostAdaptedCoverSizeForWidth(
        PixelRatio.getPixelSizeForLayoutSize(windowWidth),
      ),
      source,
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
  }, [kind, source, useLargeImage, windowWidth]);

  switch (kind) {
    case 'picture':
      return <Animated.Image {...props} source={imageSource!} style={style} />;
    case 'video':
      return (
        <AnimatedVideo
          {...props}
          source={{ uri: getCoverVideoURLFor(source) }}
          style={style}
          allowsExternalPlayback={false}
          hideShutterView
          muted
          playWhenInactive
          repeat
          resizeMode="cover"
          // TODO check security and performance
          useTextureView
          // TODO
          //poster
          //posterResizeMode
        />
      );
    default:
      return null;
  }
};

export default CoverRendererImage;

const TIMEOUTS = [1000, 3000, 10000];

const AnimatedVideo = Animated.createAnimatedComponent(Video);
