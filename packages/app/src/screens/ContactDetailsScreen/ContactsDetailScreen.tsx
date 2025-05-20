import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import useOnInviteContact from '#components/Contact/useOnInviteContact';
import { useRouter } from '#components/NativeRouter';
import { readContactData } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import ContactDetailsBody from './ContactDetailsBody';
import type { NativeScreenProps } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactsDetailScreenQuery } from '#relayArtifacts/ContactsDetailScreenQuery.graphql';
import type {
  ContactDetailsRoute,
  ContactDetailsFromScannerRoute,
} from '#routes';

const query = graphql`
  query ContactsDetailScreenQuery($contactId: ID!) {
    node(id: $contactId) {
      ... on Contact @alias(as: "contact") {
        id
        ...contactHelpersReadContactData
        contactProfile {
          webCard {
            ...ContactDetailsBody_webCard
          }
        }
      }
    }
  }
`;

const ContactDetailsScreen = ({
  preloadedQuery,
}: RelayScreenProps<ContactDetailsRoute, ContactsDetailScreenQuery>) => {
  const router = useRouter();
  const { node } = usePreloadedQuery<ContactsDetailScreenQuery>(
    query,
    preloadedQuery,
  );
  const contact = useMemo(() => {
    if (node?.contact) {
      return readContactData(node.contact);
    }
    return null;
  }, [node]);
  const webCard = node?.contact?.contactProfile?.webCard ?? null;

  const onInviteContact = useOnInviteContact();
  const onInviteContactInner = useCallback(async () => {
    if (!contact) {
      return;
    }
    await onInviteContact(contact);
  }, [contact, onInviteContact]);

  const styles = useStyleSheet(stylesheet);
  /* This View collapsable={false} is here to fix shadow issue: https://github.com/AzzappApp/azzapp/pull/7316
        Original discussion in react-native-screens: https://github.com/software-mansion/react-native-screens/issues/2669 */
  return (
    <View collapsable={false} style={styles.container}>
      {contact ? (
        <ContactDetailsBody
          contact={contact}
          webCard={webCard}
          onClose={router.back}
          onSave={onInviteContactInner}
        />
      ) : undefined}
    </View>
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
});

export const ContactDetailsFromScannedContactScreen = ({
  route: {
    params: { scannedContact: contact },
  },
}: NativeScreenProps<ContactDetailsFromScannerRoute>) => {
  const router = useRouter();

  const onInviteContact = useOnInviteContact();
  const onInviteContactInner = useCallback(async () => {
    if (!contact) {
      return;
    }
    await onInviteContact(contact);
  }, [contact, onInviteContact]);

  const styles = useStyleSheet(stylesheet);
  /* This View collapsable={false} is here to fix shadow issue: https://github.com/AzzappApp/azzapp/pull/7316
        Original discussion in react-native-screens: https://github.com/software-mansion/react-native-screens/issues/2669 */
  return (
    <View collapsable={false} style={styles.container}>
      {contact ? (
        <ContactDetailsBody
          contact={contact}
          webCard={null}
          onClose={router.back}
          onSave={onInviteContactInner}
        />
      ) : undefined}
    </View>
  );
};

ContactDetailsFromScannedContactScreen.options = {
  stackAnimation: 'slide_from_bottom',
};

const stylesheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
    backgroundColor: appearance === 'dark' ? colors.grey1000 : colors.white,
  },
}));
