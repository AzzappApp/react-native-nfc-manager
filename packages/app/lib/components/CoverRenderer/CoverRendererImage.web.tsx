import {
  COVER_BASE_WIDTH,
  getCoverURLForSize,
  getCoverVideoURLFor,
} from '@azzapp/shared/lib/imagesFormats';
import range from 'lodash/range';
import { StyleSheet } from 'react-native';
import createHTMLElement from '../../helpers/createHTMLElement';
import type { MediaKind } from '@azzapp/relay/artifacts/CoverRenderer_cover.graphql';
import type { ImageProps } from 'react-native';

type CoverRendererImageProps = Omit<ImageProps, 'source'> & {
  picture: Readonly<{ source: string; kind: MediaKind }>;
  useLargeImage?: boolean;
};

const CoverRendererImage = ({
  picture,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useLargeImage,
  style,
  ...props
}: CoverRendererImageProps) => {
  const coverSizes = range(1, 14);

  switch (picture.kind) {
    case 'picture':
      return createHTMLElement('img', {
        ...props,
        style: [style, styles.coverImage],
        srcSet: picture
          ? coverSizes
              .map(size => {
                const url = getCoverURLForSize(size, picture.source);
                const width = COVER_BASE_WIDTH * size;
                return `${url} ${width}w`;
              })
              .join(',')
          : undefined,
        sizes: picture ? (useLargeImage ? '100vw' : '125px') : undefined,
      });
    case 'video':
      return createHTMLElement('video', {
        ...props,
        style: [style, styles.coverImage],
        src: getCoverVideoURLFor(picture.source),
        autoPlay: true,
        loop: true,
        muted: true,
        playsInline: true,
      });
    default:
      return null;
  }
};

export default CoverRendererImage;

const styles = StyleSheet.create({
  coverImage: {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 300ms ease',
  },
});
