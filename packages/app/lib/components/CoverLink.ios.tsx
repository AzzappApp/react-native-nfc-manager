import { COVER_CARD_RADIUS } from '@azzapp/shared/lib/cardHelpers';
import { useRef, useState } from 'react';
import { useRouter } from '../PlatformEnvironment';
import PressableScaleHighlight from '../ui/PressableScaleHighlight';
import CoverRenderer from './CoverRenderer';
import type { CoverHandle, CoverRendererProps } from './CoverRenderer';
import type { View } from 'react-native';

const CoverLink = ({
  userId,
  userName,
  style,
  coverStyle,
  ...props
}: CoverRendererProps & {
  userId: string;
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
    <PressableScaleHighlight
      onPress={onPress}
      ref={ref}
      style={[
        style,
        {
          overflow: 'hidden',
          borderRadius: COVER_CARD_RADIUS * (props.width as number),
        },
      ]}
      accessibilityRole="link"
    >
      {({ pressed }) => (
        <CoverRenderer
          {...props}
          userName={userName}
          ref={coverRef}
          style={coverStyle}
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
    </PressableScaleHighlight>
  );
};

export default CoverLink;
