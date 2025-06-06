import { graphql, useFragment } from 'react-relay';
import CoverLinkRenderer from './CoverLinkRenderer';
import type { CoverLink_webCard$key } from '#relayArtifacts/CoverLink_webCard.graphql';
import type { CoverLinkRendererProps } from './coverLinkTypes';

export type CoverLinkProps = Omit<
  CoverLinkRendererProps,
  'userName' | 'webCard' | 'webCardId' | 'webCardKey'
> & {
  webCard: CoverLink_webCard$key;
};

const CoverLink = ({ webCard: webCardKey, ...props }: CoverLinkProps) => {
  const webCard = useFragment(
    graphql`
      fragment CoverLink_webCard on WebCard {
        id
        userName
        ...CoverLinkRenderer_webCard
        ...CoverLinkRendererIos_webCard
      }
    `,
    webCardKey,
  );

  return (
    <CoverLinkRenderer
      {...props}
      userName={webCard.userName}
      webCardId={webCard.id}
      webCard={webCard}
    />
  );
};

export default CoverLink;
