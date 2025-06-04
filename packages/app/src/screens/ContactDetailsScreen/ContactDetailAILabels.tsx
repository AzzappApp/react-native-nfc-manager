import { graphql, useFragment } from 'react-relay';
import { ContactDetailAIItemLabels } from './ContactDetailAIItemLabels';
import type { ContactDetailAILabels_enrichment$key } from '#relayArtifacts/ContactDetailAILabels_enrichment.graphql';

export const ContactDetailAILabels = ({
  contact: contactKey,
}: {
  contact: ContactDetailAILabels_enrichment$key | null;
}) => {
  const publicProfile = useFragment(
    graphql`
      fragment ContactDetailAILabels_enrichment on PublicProfile {
        interests {
          name
          icon
        }
        skills {
          name
          icon
        }
      }
    `,
    contactKey,
  );

  const interests = publicProfile?.interests;
  const skills = publicProfile?.skills;

  if (!interests?.length && !skills?.length) return null;
  return (
    <ContactDetailAIItemLabels
      items={[...(interests || []), ...(skills || [])]}
    />
  );
};
