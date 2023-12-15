import { useAnimatedProps } from 'react-native-reanimated';
import CoverLottiePlayer from '#components/CoverRenderer/CoverLottiePlayer';
import { MediaImageRenderer } from '#components/medias';
import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type CoverStaticMediaLayerProps = ViewProps & {
  mediaId: string;
  kind: string;
  uri: string;
  requestedSize: number;
  tintColor: string | null | undefined;
  animationSharedValue: SharedValue<number> | null;
  onReady?: () => void;
  onError?: (error: any) => void;
};

const CoverStaticMediaLayer = ({
  mediaId,
  kind,
  uri,
  requestedSize,
  tintColor,
  onReady,
  onError,
  animationSharedValue,
  ...props
}: CoverStaticMediaLayerProps) => {
  const animationProps = useAnimatedProps(() => {
    return {
      progress: animationSharedValue?.value ?? 0.5,
    };
  }, [animationSharedValue]);

  if (kind === 'png') {
    return (
      <MediaImageRenderer
        source={{
          uri,
          requestedSize,
          mediaId,
        }}
        tintColor={tintColor}
        onReadyForDisplay={onReady}
        onError={onError}
        {...props}
      />
    );
  } else if (kind === 'lottie') {
    return (
      <CoverLottiePlayer
        src={uri}
        autoPlay={false}
        hardwareAccelerationAndroid
        onAnimationLoaded={onReady}
        onAnimationFailure={onError}
        onError={onError}
        animatedProps={animationProps}
        tintColor={tintColor ?? '#000000'}
        {...props}
      />
    );
  }
  console.warn(`Unsupported media kind for cover: ${kind}`);
  return null;
};

export default CoverStaticMediaLayer;
