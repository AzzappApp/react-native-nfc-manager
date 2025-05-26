import { useCallback } from 'react';
import { View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import useOnInviteContact from '#components/Contact/useOnInviteContact';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import { TooltipProvider } from '#helpers/TooltipContext';
import ContactDetailsBody from './ContactDetailsBody';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactsDetailScreenQuery } from '#relayArtifacts/ContactsDetailScreenQuery.graphql';
import type { ContactDetailsRoute } from '#routes';

const query = graphql`
  query ContactsDetailScreenQuery($contactId: ID!) {
    node(id: $contactId) {
      ... on Contact @alias(as: "contact") {
        id
        ...ContactDetailsBody_contact
        ...contactHelpersShareContactData_contact
        ...useOnInviteContactDataQuery_contact
        enrichment {
          ...ContactDetailAIItemLocations_enrichment
          ...ContactDetailAISummary_enrichment
          ...ContactDetailAILabels_enrichment
          ...ContactDetailAIItemProfessionalExperiences_enrichment
          ...ContactDetailAIItemEducation_enrichment
        }
        contactProfile {
          webCard {
            ...ContactDetailAvatar_webCard
          }
        }
      }
    }
  }
`;

const ContactDetailsScreen = ({
  preloadedQuery,
  refreshQuery,
  hasFocus,
}: RelayScreenProps<ContactDetailsRoute, ContactsDetailScreenQuery>) => {
  const router = useRouter();
  const { node } = usePreloadedQuery<ContactsDetailScreenQuery>(
    query,
    preloadedQuery,
  );

  const webCard = node?.contact?.contactProfile?.webCard ?? null;

  const onInviteContact = useOnInviteContact();
  const onInviteContactInner = useCallback(async () => {
    if (!node?.contact) {
      return;
    }
    await onInviteContact(node?.contact);
  }, [node?.contact, onInviteContact]);

  const styles = useStyleSheet(stylesheet);
  /* This View collapsable={false} is here to fix shadow issue: https://github.com/AzzappApp/azzapp/pull/7316
        Original discussion in react-native-screens: https://github.com/software-mansion/react-native-screens/issues/2669 */
  return (
    <TooltipProvider>
      <View collapsable={false} style={styles.container}>
        {node?.contact ? (
          <ContactDetailsBody
            refreshQuery={refreshQuery}
            contactKey={node?.contact}
            onClose={router.back}
            webCard={webCard}
            onSave={onInviteContactInner}
            hasFocus={hasFocus}
          />
        ) : undefined}
      </View>
    </TooltipProvider>
  );
};

export default relayScreen(ContactDetailsScreen, {
  query,
  getVariables: ({ contactId }) => {
    return {
      contactId,
    };
  },
  getScreenOptions() {
    return {
      stackAnimation: 'slide_from_bottom',
    };
  },
  fetchPolicy: 'store-and-network',
});

const stylesheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
    backgroundColor: appearance === 'dark' ? colors.black : colors.white,
  },
}));
