import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import {
  buildLocalContact,
  buildLocalContactFromDetailScreenData,
} from '#helpers/contactListHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useOnInviteContact from '#hooks/useOnInviteContact';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import { get as PixelRatio } from '#relayProviders/PixelRatio.relayprovider';
import { get as ScreenWidth } from '#relayProviders/ScreenWidth.relayprovider';
import ContactDetailsBody from './ContactDetailsBody';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactsDetailScreenQuery } from '#relayArtifacts/ContactsDetailScreenQuery.graphql';
import type { ContactDetailsRoute } from '#routes';
import type { Contact } from 'expo-contacts';

const query = graphql`
  query ContactsDetailScreenQuery($contactId: ID!, $pixelRatio: Float!) {
    contact: node(id: $contactId) {
      ... on Contact {
        id
        firstName
        lastName
        company
        title
        createdAt
        emails {
          label
          address
        }
        phoneNumbers {
          label
          number
        }
        addresses {
          address
          label
        }
        socials {
          label
          url
        }
        urls {
          url
        }
        avatar {
          id
          uri: uri(width: 61, pixelRatio: $pixelRatio, format: png)
        }
        logo {
          id
          uri: uri(width: 61, pixelRatio: $pixelRatio, format: png)
        }
        birthday
        meetingPlace {
          city
          region
          subregion
          country
        }
        contactProfile {
          id
          avatar {
            id
            uri: uri(width: 61, pixelRatio: $pixelRatio, format: png)
          }
          contactCard {
            urls {
              address
              selected
            }
            socials {
              url
              label
              selected
            }
          }
          webCard {
            ...CoverRenderer_webCard
            ...ContactDetailsBody_webCard
            id
            cardIsPublished
            userName
            hasCover
            commonInformation {
              addresses {
                label
                address
              }
              company
              emails {
                label
                address
              }
              phoneNumbers {
                label
                number
              }
              socials {
                label
                url
              }
              urls {
                address
              }
            }
          }
        }
      }
    }
  }
`;

const ContactDetailsScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<ContactDetailsRoute, ContactsDetailScreenQuery>) => {
  const styles = useStyleSheet(stylesheet);

  const router = useRouter();
  const { contact } = usePreloadedQuery<ContactsDetailScreenQuery>(
    query,
    preloadedQuery,
  );

  // We need to use an intermediate state to avoid buildLocalContact which is an async function
  const [displayedContact, setDisplayedContact] = useState<Contact | null>(
    null,
  );

  const updateContact = useCallback(async () => {
    if (params.contact) {
      setDisplayedContact(await buildLocalContact(params.contact));
    } else {
      setDisplayedContact(await buildLocalContactFromDetailScreenData(contact));
    }
  }, [contact, params.contact]);

  useEffect(() => {
    updateContact();
  }, [updateContact]);

  const webCardKey = contact?.contactProfile?.webCard;

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
      {displayedContact && params.contactId ? (
        <ContactDetailsBody
          details={{
            ...displayedContact,
            createdAt: contact?.createdAt,
            id: params.contactId,
          }}
          webCardKey={webCardKey}
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
      pixelRatio: PixelRatio(),
      screenWidth: ScreenWidth(),
      cappedPixelRatio: CappedPixelRatio(),
    };
  },
});
