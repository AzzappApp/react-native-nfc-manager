import { graphql, useFragment } from 'react-relay';
import CoverLinkRenderer from './CoverLinkRenderer';
import type { CoverLink_webCard$key } from '#relayArtifacts/CoverLink_webCard.graphql';
import type { CoverLinkRendererProps } from './coverLinkTypes';

export type CoverLinkProps = Omit<
  CoverLinkRendererProps,
  'userName' | 'webCard' | 'webCardKey'
> & {
  webCard: CoverLink_webCard$key;
};

const CoverLink = ({ webCard: webCardKey, ...props }: CoverLinkProps) => {
  const webCard = useFragment(
    graphql`
      fragment CoverLink_webCard on WebCard {
        userName
        ...CoverRenderer_webCard
        ...useCoverLinkRendererFragment_webCard
      }
    `,
    webCardKey,
  );

  return (
    <CoverLinkRenderer
      {...props}
      userName={webCard.userName}
      webCard={webCard}
    />
  );
};

export default CoverLink;
