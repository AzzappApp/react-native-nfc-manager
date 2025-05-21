import { Image } from 'expo-image';
import { FormattedMessage } from 'react-intl';
import { View, useColorScheme } from 'react-native';
import { useFragment } from 'react-relay';
import { graphql } from 'relay-runtime';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import { ContactDetailAIFooter } from './ContactDetailAIFooter';
import { ContactDetailAIItemEducation } from './ContactDetailAIItemEducation';
// import { ContactDetailAIItemImages } from './ContactDetailAIItemImages';
import { ContactDetailAIItemLocations } from './ContactDetailAIItemLocations';
import { ContactDetailAIItemProfessionalExperiences } from './ContactDetailAIItemProfessionalExperiences';
import { ContactDetailAILabels } from './ContactDetailAILabels';
import { ContactDetailAISummary } from './ContactDetailAISummary';
import type { ContactDetailFragmentAI_contact$key } from '#relayArtifacts/ContactDetailFragmentAI_contact.graphql';

export const ContactDetailFragmentAI = ({
  contact: contactKey,
}: {
  contact?: ContactDetailFragmentAI_contact$key | null;
}) => {
  const colorScheme = useColorScheme();
  const styles = useStyleSheet(stylesheet);
  const data = useFragment(
    graphql`
      fragment ContactDetailFragmentAI_contact on Contact {
        enrichmentStatus
        enrichment {
          approved
          ...ContactDetailAIItemLocations_enrichment
          ...ContactDetailAISummary_enrichment
          ...ContactDetailAILabels_enrichment
          ...ContactDetailAIItemProfessionalExperiences_enrichment
          ...ContactDetailAIItemEducation_enrichment
        }
      }
    `,
    contactKey,
  );

  if (!data?.enrichment) {
    // placeholder image
    return (
      <View style={styles.placeHolderContainer}>
        <Image
          source={
            colorScheme === 'dark'
              ? require('#assets/placeholder_profile_dark.png')
              : require('#assets/placeholder_profile.png')
          }
          contentFit="contain"
          style={styles.placeHolder}
        />
      </View>
    );
  }
  return (
    <View style={styles.aiContainer}>
      <Text variant="medium" style={styles.aiHeader}>
        <FormattedMessage
          defaultMessage="Azzapp AI solution helps you discover your contact through public information."
          description="ContactDetailsModal - Title for AI profile view"
        />
      </Text>
      <View style={styles.aiDetailsContainer}>
        {/* 
        to be reenabled when we have data from server
        {enrichDetails?.imageUrls && (
          <ContactDetailAIItemImages imageUrls={enrichDetails.imageUrls} />
        )} */}
        <ContactDetailAIItemLocations contact={data.enrichment} />
        <ContactDetailAISummary contact={data.enrichment} />
        <ContactDetailAILabels contact={data.enrichment} />
        <ContactDetailAIItemEducation contact={data.enrichment} />
        <ContactDetailAIItemProfessionalExperiences contact={data.enrichment} />
        <ContactDetailAIFooter />
      </View>
    </View>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  aiContainer: {
    gap: 20,
    marginTop: 20,
  },
  aiDetailsContainer: {
    gap: 40,
  },
  aiHeader: {
    color: appearance === 'dark' ? colors.grey600 : colors.grey400,
    paddingBottom: 10,
    textAlign: 'center',
  },
  placeHolderContainer: {
    width: '100%',
    height: '90%',
  },
  placeHolder: { width: '100%', height: '100%' },
}));
