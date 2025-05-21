import { StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import Text from '#ui/Text';
import { ContactDetailExpendableSection } from './ContactDetailExpendableSection';
import type { ContactDetailAISummary_enrichment$key } from '#relayArtifacts/ContactDetailAISummary_enrichment.graphql';

export const ContactDetailAISummary = ({
  contact: contactKey,
}: {
  contact: ContactDetailAISummary_enrichment$key | null;
}) => {
  const enrichment = useFragment(
    graphql`
      fragment ContactDetailAISummary_enrichment on ContactEnrichment {
        publicProfile {
          summary
        }
      }
    `,
    contactKey,
  );
  const summary = enrichment?.publicProfile?.summary;
  if (!summary) return null;
  return (
    <ContactDetailExpendableSection minHeight={210}>
      <Text style={styles.centeredText}>{summary}</Text>
    </ContactDetailExpendableSection>
  );
};

const styles = StyleSheet.create({
  centeredText: { textAlign: 'center' },
});
