import { useRef } from 'react';
import { COVER_CARD_RADIUS } from '@azzapp/shared/lib/cardHelpers';
import { useRouter } from '../PlatformEnvironment';
import PressableScaleHighlight from '../ui/PressableScaleHighlight';
import CoverRenderer from './CoverRenderer';
import type { CoverRendererProps } from './CoverRenderer';
import type { StyleProp, View, ViewStyle } from 'react-native';

const CoverLink = ({
  profileID,
  userName,
  style,
  coverStyle,
  ...props
}: CoverRendererProps & {
  profileID: string;
  coverStyle: StyleProp<ViewStyle>;
}) => {
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
