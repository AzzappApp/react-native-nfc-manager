import { memo, useMemo } from 'react';
import { graphql, useFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import Link from '#components/Link';
import LinkWebCard from '#components/LinkWebCard';
import PressableScaleHighlight from '#ui/PressableScaleHighlight';
import CoverRenderer from '../CoverRenderer';
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
  coverIsPredefined,
  ...props
}: CoverLinkRendererProps) => {
  const webCard = useFragment(
    graphql`
      fragment CoverLinkRenderer_webCard on WebCard {
        coverIsPredefined
      }
    `,
    props.webCard,
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

  if (webCard?.coverIsPredefined) {
    return (
      <Link
        route="COVER_TEMPLATE_SELECTION"
        prefetch={prefetch}
        disabled={disabled}
      >
        <PressableScaleHighlight
          style={containerStyle}
          onLongPress={onLongPress}
        >
          <CoverRenderer {...props} style={coverStyle} />
        </PressableScaleHighlight>
      </Link>
    );
  }
  return (
    <LinkWebCard params={props} prefetch={prefetch} disabled={disabled}>
      <PressableScaleHighlight style={containerStyle} onLongPress={onLongPress}>
        <CoverRenderer {...props} style={coverStyle} />
      </PressableScaleHighlight>
    </LinkWebCard>
  );
};

// memo is recommanded as coverlink is used in FlatList
export default memo(CoverLink);
