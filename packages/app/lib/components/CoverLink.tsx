import { useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from '../PlatformEnvironment';
import CoverRenderer from './CoverRenderer';
import type {
  CoverHandle,
  CoverRendererProps,
} from './CoverRenderer/CoverRenderer';
import type { StyleProp, ViewStyle, View } from 'react-native';

const CoverLink = ({
  userId,
  userName,
  style,
  coverStyle,
  ...props
}: CoverRendererProps & {
  userId: string;
  coverStyle?: StyleProp<ViewStyle>;
}) => {
  const coverRef = useRef<CoverHandle | null>(null);
  const ref = useRef<View | null>(null);
  const [coverState, setCoverState] = useState<
    { imageIndex: number; videoTime?: number | null } | undefined
  >();

  const router = useRouter();
  const onPress = () => {
    const container = ref.current;
    const cover = coverRef.current;
    if (!container || !cover) {
      router.push({
        route: 'USER',
        params: {
          userName,
          userId,
        },
      });
      return;
    }
    container.measureInWindow(async (x, y, width, height) => {
      await coverRef.current?.snapshot();
      const videoTime = await coverRef.current?.getCurrentVideoTime();
      router.push({
        route: 'USER',
        params: {
          userName,
          userId,
          imageIndex: coverRef.current?.getCurrentImageIndex(),
          videoTime,
          fromRectangle: { x, y, width, height },
          setOriginCoverState: setCoverState,
        },
      });
    });
  };

  return (
    <Pressable
      onPress={onPress}
      ref={ref}
      style={style}
      accessibilityRole="link"
    >
      {({ pressed }) => (
        <CoverRenderer
          {...props}
          userName={userName}
          ref={coverRef}
          style={[coverStyle, pressed && { opacity: 0.8 }]}
          videoPaused={pressed ? true : props.videoPaused}
          playTransition={pressed ? false : props.playTransition}
          imageIndex={coverState?.imageIndex}
          initialVideosTimes={
            coverState
              ? { [coverState.imageIndex]: coverState.videoTime }
              : null
          }
        />
      )}
    </Pressable>
  );
};

export default CoverLink;
