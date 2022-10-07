import PressableScaleHighlight from '../ui/PressableScaleHighlight';
import CoverRenderer from './CoverRenderer';
import Link from './Link';
import type { CoverRendererProps } from './CoverRenderer';
import type { StyleProp, ViewStyle } from 'react-native';

const CoverLink = ({
  style,
  coverStyle,
  ...props
}: CoverRendererProps & {
  userId: string;
  coverStyle?: StyleProp<ViewStyle>;
}) => (
  <Link
    route="USER"
    params={{
      userName: props.userName,
    }}
  >
    <PressableScaleHighlight
      style={[
        style,
        {
          overflow: 'hidden',
          borderRadius: '12.8%' as any,
        },
      ]}
    >
      {({ pressed }) => (
        <CoverRenderer
          {...props}
          style={coverStyle}
          videoPaused={pressed}
          playTransition={!pressed}
        />
      )}
    </PressableScaleHighlight>
  </Link>
);

export default CoverLink;
