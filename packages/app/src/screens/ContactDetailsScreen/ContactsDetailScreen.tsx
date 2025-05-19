import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { readContactData } from '#helpers/contactListHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useOnInviteContact from '#hooks/useOnInviteContact';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import { get as ScreenWidth } from '#relayProviders/ScreenWidth.relayprovider';
import ContactDetailsBody from './ContactDetailsBody';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactsDetailScreenQuery } from '#relayArtifacts/ContactsDetailScreenQuery.graphql';
import type { ContactDetailsRoute } from '#routes';

const query = graphql`
  query ContactsDetailScreenQuery($contactId: ID!) {
    node(id: $contactId) {
      ...contactListHelpersReadContact_contact @alias(as: "contact")
    }
  }
`;

const ContactDetailsScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<ContactDetailsRoute, ContactsDetailScreenQuery>) => {
  const styles = useStyleSheet(stylesheet);

  const router = useRouter();
  const { node } = usePreloadedQuery<ContactsDetailScreenQuery>(
    query,
    preloadedQuery,
  );
  const contact = node?.contact;

  const displayedContact = useMemo(
    () => params.scannedContact ?? (contact ? readContactData(contact) : null),
    [contact, params.scannedContact],
  );

  const onInviteContact = useOnInviteContact();

  const onInviteContactInner = useCallback(async () => {
    if (!displayedContact) {
      return;
    }
    await onInviteContact(displayedContact);
  }, [displayedContact, onInviteContact]);

  /* This View collapsable={false} is here to fix shadow issue: https://github.com/AzzappApp/azzapp/pull/7316
        Original discussion in react-native-screens: https://github.com/software-mansion/react-native-screens/issues/2669 */
  return (
    <View collapsable={false} style={styles.container}>
      {displayedContact ? (
        <ContactDetailsBody
          contact={displayedContact}
          onClose={router.back}
          onSave={onInviteContactInner}
        />
      ) : undefined}
    </View>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
    backgroundColor: appearance === 'dark' ? colors.grey1000 : colors.white,
  },
}));

ContactDetailsScreen.options = {
  stackAnimation: 'slide_from_bottom',
};

export default relayScreen(ContactDetailsScreen, {
  query,
  getVariables: ({ webCardId, contactId }) => {
    return {
      webCardId: webCardId ?? '',
      contactId: contactId ?? '',
      screenWidth: ScreenWidth(),
      cappedPixelRatio: CappedPixelRatio(),
    };
  },
});
