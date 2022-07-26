import omit from 'lodash/omit';
import createHTMLElement from '../../helpers/createHTMLElement';
import type { Animated } from 'react-native';
import type { VideoProperties } from 'react-native-video';

type CoverRendererVideoProps = Omit<
  Animated.AnimatedProps<VideoProperties>,
  'source'
> & {
  uri: string;
  hidden?: boolean;
};

const CoverRendererVideo = ({
  uri,
  style,
  hidden,
  ...props
}: CoverRendererVideoProps) => {
  return createHTMLElement('video', {
    ...omit(props, 'largeURI', 'smallURI'),
    style: [
      style,
      {
        objectFit: 'cover',
        opacity: hidden ? 0 : 1,
        transition: 'opacity 300ms ease',
      },
    ],
    src: uri,
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
  });
};

export default CoverRendererVideo;
