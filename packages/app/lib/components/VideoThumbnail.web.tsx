import { getCoverVideoURLFor } from '@azzapp/shared/lib/imagesFormats';
import createHTMLElement from '../helpers/createHTMLElement';
import type { ImageProps } from 'react-native';

const VideoThumbnail = ({
  uri,
  ...props
}: Omit<ImageProps, 'source'> & { uri: string }) => {
  return createHTMLElement('video', {
    ...props,
    src: getCoverVideoURLFor(uri),
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
  });
};

export default VideoThumbnail;
