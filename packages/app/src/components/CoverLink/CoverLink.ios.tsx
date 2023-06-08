import { useRef } from 'react';
import { COVER_CARD_RADIUS } from '@azzapp/shared/coverHelpers';
import { useRouter } from '#PlatformEnvironment';
import CoverRenderer from '#components/CoverRenderer';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import type { CoverLinkProps } from './coverLinkTypes';
import type { View } from 'react-native';

/**
 * iOS version of the cover link, it dispatches a push to the profile screen with
 * the native reveal animation
 */
const CoverLink = ({
  profileID,
  userName,
  style,
  coverStyle,
  ...props
}: CoverLinkProps) => {
  const ref = useRef<View | null>(null);

  const router = useRouter();
  const onPress = () => {
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
          profileID,
          fromRectangle: { x, y, width, height },
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
      <CoverRenderer {...props} userName={userName} style={coverStyle} />
    </PressableScaleHighlight>
  );
};

export default CoverLink;
