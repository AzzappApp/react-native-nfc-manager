import { useEffect, useRef } from 'react';
import { COVER_CARD_RADIUS } from '@azzapp/shared/coverHelpers';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import type { CoverLinkRendererProps } from './coverLinkTypes';
import type { GestureResponderEvent, View } from 'react-native';

/**
 * iOS version of the cover link, it dispatches a push to the profile screen with
 * the native reveal animation
 */
const CoverLink = ({
  profileId,
  userName,
  style,
  coverStyle,
  prefetch = false,
  onPress,
  ...props
}: CoverLinkRendererProps) => {
  const ref = useRef<View | null>(null);
  const router = useRouter();
  const prefetchScreen = usePrefetchRoute();

  const onPressInner = (event: GestureResponderEvent) => {
    onPress?.(event);
    if (event.defaultPrevented) {
      return;
    }
    const container = ref.current;
    if (!container) {
      router.push({
        route: 'PROFILE',
        params: {
          userName,
        },
      });
      return;
    }
    container.measureInWindow(async (x, y, width, height) => {
      router.push({
        route: 'PROFILE',
        params: {
          userName,
          profileId,
          fromRectangle: { x, y, width, height },
        },
      });
    });
  };

  useEffect(() => {
    if (prefetch) {
      prefetchScreen({
        route: 'PROFILE',
        params: {
          userName,
          profileId,
        },
      });
    }
  }, [prefetch, prefetchScreen, userName, profileId]);

  return (
    <PressableScaleHighlight
      onPress={onPressInner}
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
      <CoverRenderer {...props} style={coverStyle} />
    </PressableScaleHighlight>
  );
};

export default CoverLink;
