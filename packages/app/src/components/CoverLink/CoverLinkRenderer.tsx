import { memo } from 'react';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import CoverRenderer from '../CoverRenderer';
import Link from '../Link';
import type { CoverLinkRendererProps } from './coverLinkTypes';

/**
 * A cover link is a cover renderer wrapped in a link to the profile page
 */
const CoverLink = ({
  style,
  coverStyle,
  prefetch = false,
  onPress,
  ...props
}: CoverLinkRendererProps) => (
  <Link
    route="PROFILE"
    params={{
      userName: props.userName,
    }}
    prefetch={prefetch}
    onPress={onPress}
  >
    <PressableScaleHighlight
      style={[
        style,
        {
          overflow: 'hidden',
          borderRadius: COVER_CARD_RADIUS * (props.width as number),
          aspectRatio: COVER_RATIO,
        },
      ]}
    >
      <CoverRenderer {...props} style={coverStyle} />
    </PressableScaleHighlight>
  </Link>
);

// memo is recommanded as coverlink is used in FlatList
export default memo(CoverLink);
