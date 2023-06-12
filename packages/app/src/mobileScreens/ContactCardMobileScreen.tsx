import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import ContactCardScreen from '#screens/ContactCardScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactCardRoute } from '#routes';
import type { ContactCardMobileScreenQuery } from '@azzapp/relay/artifacts/ContactCardMobileScreenQuery.graphql';

const contactCardMobileScreenQuery = graphql`
  query ContactCardMobileScreenQuery {
    viewer {
      ...ContactCardScreen_viewer
    }
  }
`;

const ContactCardMobileScreen = ({
  preloadedQuery,
}: RelayScreenProps<ContactCardRoute, ContactCardMobileScreenQuery>) => {
  const { viewer } = usePreloadedQuery(
    contactCardMobileScreenQuery,
    preloadedQuery,
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ContactCardScreen viewer={viewer} />
    </SafeAreaView>
  );
};

export default relayScreen(ContactCardMobileScreen, {
  query: contactCardMobileScreenQuery,
});
