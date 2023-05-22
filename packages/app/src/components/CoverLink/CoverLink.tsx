import { COVER_CARD_RADIUS } from '@azzapp/shared/coverHelpers';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import CoverRenderer from '../CoverRenderer';
import Link from '../Link';
import type { CoverLinkProps } from './coverLinkTypes';

/**
 * A cover link is a cover renderer wrapped in a link to the profile page
 */
const CoverLink = ({ style, coverStyle, ...props }: CoverLinkProps) => (
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
