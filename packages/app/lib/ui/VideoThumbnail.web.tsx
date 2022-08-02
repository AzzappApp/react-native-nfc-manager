import { getVideoUrlForSize } from '@azzapp/shared/lib/imagesHelpers';
import omit from 'lodash/omit';
import createHTMLElement from '../helpers/createHTMLElement';
import type { ImageProps } from 'react-native';

// TODO find a better way to achieve that
const VideoThumbnail = ({
  source,
  ...props
}: Omit<ImageProps, 'source'> & { source: string }) => {
  return createHTMLElement('video', {
    ...omit(props, 'ref'),
    src: getVideoUrlForSize(source),
    autoPlay: false,
    loop: false,
    muted: true,
    playsInline: true,
    style: [props.style, { objectFit: 'cover' } as any],
  } as any);
};

export default VideoThumbnail;
