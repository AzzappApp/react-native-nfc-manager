import { COVER_CARD_RADIUS } from '@azzapp/shared/cardHelpers';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import CoverRenderer from './CoverRenderer';
import Link from './Link';
import type { CoverRendererProps } from './CoverRenderer';
import type { StyleProp, ViewStyle } from 'react-native';

const CoverLink = ({
  style,
  coverStyle,
  ...props
}: CoverRendererProps & {
  profileID: string;
  coverStyle?: StyleProp<ViewStyle>;
}) => (
  <Link
    route="PROFILE"
    params={{
      userName: props.userName,
    }}
  >
    <PressableScaleHighlight
      style={[
        style,
        {
          overflow: 'hidden',
          borderRadius: COVER_CARD_RADIUS * (props.width as number),
        },
      ]}
    >
      <CoverRenderer {...props} style={coverStyle} />
    </PressableScaleHighlight>
  </Link>
);

export default CoverLink;
