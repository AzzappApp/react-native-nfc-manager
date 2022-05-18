import {
  COVER_BASE_WIDTH,
  getCoverURLForSize,
} from '@azzapp/shared/lib/imagesFormats';
import range from 'lodash/range';
import { StyleSheet } from 'react-native';
import createHTMLElement from '../../helpers/createHTMLElement';
import type { ImageProps } from 'react-native';

type CoverRendererImageProps = Omit<ImageProps, 'source'> & {
  picture: string | null | undefined;
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

  return createHTMLElement('img', {
    ...props,
    style: [style, styles.coverImage],
    srcSet: picture
      ? coverSizes
          .map(size => {
            const url = getCoverURLForSize(size, picture);
            const width = COVER_BASE_WIDTH * size;
            return `${url} ${width}w`;
          })
          .join(',')
      : undefined,
    sizes: picture ? (useLargeImage ? '100vw' : '125px') : undefined,
  });
};

export default CoverRendererImage;

const styles = StyleSheet.create({
  coverImage: {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});
