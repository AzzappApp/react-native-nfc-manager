import { graphql, useFragment } from 'react-relay';
import type { CoverRenderer_webCard$key } from '#relayArtifacts/CoverRenderer_webCard.graphql';

const useCoverLinkRendererFragment = (
  webCardKey: CoverRenderer_webCard$key | null | undefined,
) => {
  const webCard = useFragment(
    graphql`
      fragment useCoverLinkRendererFragment_webCard on WebCard {
        coverIsPredefined
      }
    `,
    webCardKey,
  );

  return webCard;
};

export default useCoverLinkRendererFragment;
