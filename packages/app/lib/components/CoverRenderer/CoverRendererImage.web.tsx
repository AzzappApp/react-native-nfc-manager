import {
  COVER_BASE_WIDTH,
  COVER_RATIO,
  getImageURLForSize,
} from '@azzapp/shared/lib/imagesHelpers';
import omit from 'lodash/omit';
import createHTMLElement from '../../helpers/createHTMLElement';
import type { ImageProps } from 'react-native';

type CoverRendererImageProps = Omit<ImageProps, 'source'> & {
  source: string;
  useLargeImage?: boolean;
  hidden?: boolean;
};

const CoverRendererImage = ({
  source,
  useLargeImage,
  hidden,
  style,
  ...props
}: CoverRendererImageProps) => {
  return createHTMLElement('img', {
    ...omit(props, 'largeURI', 'smallURI'),
    style: [
      style,
      {
        objectFit: 'cover',
        opacity: hidden ? 0 : 1,
        transition: 'opacity 300ms ease',
      },
    ],
    srcSet: COVER_SIZES.map(size => {
      const width = size * COVER_BASE_WIDTH;
      const url = getImageURLForSize(source, 1, width, COVER_RATIO);
      return `${url} ${width}w`;
    }).join(','),
    sizes: useLargeImage ? '100vw' : '125px',
  });
};

export default CoverRendererImage;

const COVER_SIZES = [1, 2, 3, 5, 10, 15];
