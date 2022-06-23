import createHTMLElement from '../helpers/createHTMLElement';
import type { ImageProps } from 'react-native';

const VideoThumbnail = ({
  src,
  ...props
}: Omit<ImageProps, 'source'> & { src: string }) => {
  return createHTMLElement('video', {
    ...props,
    src,
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
  });
};

export default VideoThumbnail;
