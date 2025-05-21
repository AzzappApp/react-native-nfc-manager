import { graphql, useFragment } from 'react-relay';
import { ContactDetailAIItemLabels } from './ContactDetailAIItemLabels';
import type { ContactDetailAILabels_enrichment$key } from '#relayArtifacts/ContactDetailAILabels_enrichment.graphql';

export const ContactDetailAILabels = ({
  contact: contactKey,
}: {
  contact: ContactDetailAILabels_enrichment$key | null;
}) => {
  const enrichment = useFragment(
    graphql`
      fragment ContactDetailAILabels_enrichment on ContactEnrichment {
        publicProfile {
          interests {
            name
          }
          skills {
            name
          }
        }
      }
    `,
    contactKey,
  );

  const interests = enrichment?.publicProfile?.interests;
  const skills = enrichment?.publicProfile?.skills;

  if (!interests?.length && !skills?.length) return null;
  return (
    <ContactDetailAIItemLabels
      items={[...(interests || []), ...(skills || [])]}
    />
  );
};
