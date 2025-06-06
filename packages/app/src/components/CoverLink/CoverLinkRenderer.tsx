import { memo, useMemo } from 'react';
import { graphql, useFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import Link from '#components/Link';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import CoverRenderer from '../CoverRenderer';
import type { CoverLinkRendererProps } from './coverLinkTypes';

/**
 * A cover link is a cover renderer wrapped in a link to the profile page
 */
const CoverLinkRenderer = ({
  style,
  coverStyle,
  prefetch = false,
  onPress,
  onLongPress,
  disabled,
  webCard: webCardKey,
  ...props
}: CoverLinkRendererProps) => {
  const webCard = useFragment(
    graphql`
      fragment CoverLinkRenderer_webCard on WebCard {
        ...CoverRenderer_webCard
      }
    `,
    webCardKey,
  );

  const containerStyle = useMemo(
    () => [
      style,
      {
        overflow: 'hidden' as const,
        borderRadius: COVER_CARD_RADIUS * (props.width as number),
        aspectRatio: COVER_RATIO,
      },
    ],
    [style, props.width],
  );
  return (
    <Link
      route="WEBCARD"
      params={{
        userName: props.userName!,
        webCardId: props.webCardId,
      }}
      prefetch={prefetch}
      disabled={disabled}
    >
      <PressableScaleHighlight style={containerStyle} onLongPress={onLongPress}>
        <CoverRenderer {...props} webCard={webCard} style={coverStyle} />
      </PressableScaleHighlight>
    </Link>
  );
};

// memo is recommanded as coverlink is used in FlatList
export default memo(CoverLinkRenderer);
