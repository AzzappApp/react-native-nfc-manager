import * as Sentry from '@sentry/react-native';
import { useEffect, useRef } from 'react';
import { useRelayEnvironment } from 'react-relay';
import { COVER_CARD_RADIUS } from '@azzapp/shared/coverHelpers';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import useCoverLinkRendererFragment from './useCoverLinkRendererFragment';
import type {
  MediaImageRendererHandle,
  MediaVideoRendererHandle,
} from '#components/medias';
import type { CoverLinkRendererProps } from './coverLinkTypes';
import type { GestureResponderEvent, View } from 'react-native';
import type { Disposable } from 'react-relay';

/**
 * iOS version of the cover link, it dispatches a push to the profile screen with
 * the native reveal animation
 */
const CoverLink = ({
  webCardId,
  userName,
  style,
  coverStyle,
  prefetch = false,
  onPress,
  onLongPress,
  ...props
}: CoverLinkRendererProps) => {
  const ref = useRef<View | null>(null);
  const mediaRef = useRef<
    MediaImageRendererHandle | MediaVideoRendererHandle | null
  >(null);
  const router = useRouter();
  const prefetchScreen = usePrefetchRoute();
  const webCard = useCoverLinkRendererFragment(props.webCard);

  const onPressInner = (event: GestureResponderEvent) => {
    onPress?.(event);
    if (event.defaultPrevented) {
      return;
    }
    const container = ref.current;
    if (!container) {
      if (!userName) {
        Sentry.captureMessage(
          'null username in CoverLinkRendered ios / onPress',
        );
        return;
      }

      if (webCard?.coverIsPredefined) {
        router.push({
          route: 'COVER_TEMPLATE_SELECTION',
        });
      } else {
        router.push({
          route: 'WEBCARD',
          params: {
            userName,
          },
        });
      }
      return;
    }
    container.measureInWindow(async (x, y, width, height) => {
      await mediaRef.current?.snapshot();
      if (!userName) {
        Sentry.captureMessage(
          'null username in CoverLinkRendered ios / measureInWindow',
        );
        return;
      }

      if (webCard?.coverIsPredefined) {
        router.push({
          route: 'COVER_TEMPLATE_SELECTION',
        });
      } else {
        router.push({
          route: 'WEBCARD',
          params: {
            userName,
            webCardId,
            fromRectangle: { x, y, width, height },
          },
        });
      }
    });
  };

  const environment = useRelayEnvironment();
  useEffect(() => {
    let disposable: Disposable | null = null;
    if (prefetch) {
      if (!userName) return;
      disposable = prefetchScreen(environment, {
        route: 'WEBCARD',
        params: {
          userName,
          webCardId,
        },
      });
    }
    return () => {
      disposable?.dispose();
    };
  }, [prefetch, prefetchScreen, userName, webCardId, environment]);

  return (
    <PressableScaleHighlight
      onPress={onPressInner}
      onLongPress={onLongPress}
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
      <CoverRenderer {...props} mediaRef={mediaRef} style={coverStyle} />
    </PressableScaleHighlight>
  );
};

export default CoverLink;
