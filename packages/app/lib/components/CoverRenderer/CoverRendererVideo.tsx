import { Animated } from 'react-native';
import Video from 'react-native-video';
import Fade from '../Fade';
import type { VideoProperties } from 'react-native-video';

const AnimatedVideo = Animated.createAnimatedComponent(Video);

type CoverRendererVideoProps = Omit<
  Animated.AnimatedProps<VideoProperties>,
  'source'
> & {
  source: string;
  uri: string;
  hidden?: boolean;
};

const CoverRendererVideo = ({
  uri,
  style,
  hidden,
  ...props
}: CoverRendererVideoProps) => {
  return (
    <Fade hidden={hidden}>
      <AnimatedVideo
        {...props}
        source={{ uri }}
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
    </Fade>
  );
};

export default CoverRendererVideo;
