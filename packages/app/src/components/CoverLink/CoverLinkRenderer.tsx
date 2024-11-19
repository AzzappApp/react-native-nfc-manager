import { memo, useMemo } from 'react';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
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
  onLongPress,
  disabled,
  width,
  ...props
}: CoverLinkRendererProps) => {
  width = width ?? COVER_BASE_WIDTH;
  const containerStyle = useMemo(
    () => [
      style,
      {
        overflow: 'hidden' as const,
        borderRadius: COVER_CARD_RADIUS * width,
        width,
        height: width / COVER_RATIO,
      },
    ],
    [style, width],
  );

  return (
    <Link
      route="WEBCARD"
      params={props}
      prefetch={prefetch}
      disabled={disabled}
    >
      <PressableScaleHighlight style={containerStyle} onLongPress={onLongPress}>
        <CoverRenderer {...props} width={width} style={coverStyle} />
      </PressableScaleHighlight>
    </Link>
  );
};

// memo is recommanded as coverlink is used in FlatList
export default memo(CoverLink);
