import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { isDefined } from '@azzapp/shared/isDefined';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import useOnInviteContact from '#components/Contact/useOnInviteContact';
import { useRouter } from '#components/NativeRouter';
import { useShareContact } from '#helpers/contactHelpers';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import useRemoveContact from '#hooks/useRemoveContact';
import BottomSheetModal from '#ui/BottomSheetModal';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactActionModalOption from './ContactActionModalOption';
import type { ContactActionModal_contact$key } from '#relayArtifacts/ContactActionModal_contact.graphql';
import type { Icons } from '#ui/Icon';
import type { ContactActionModalOptionProps } from './ContactActionModalOption';

type ContactActionModalProps = {
  close: () => void;
  data?:
    | ContactActionModal_contact$key
    | ContactActionModal_contact$key[]
    | null;
  onShow: (contactId: string) => void;
};

const ContactActionModal = ({
  data,
  close,
  onShow,
}: ContactActionModalProps) => {
  const intl = useIntl();
  const router = useRouter();

  const isSingleContact = !Array.isArray(data);

  const contact = useFragment(
    graphql`
      fragment ContactActionModal_contact on Contact {
        id
        enrichment {
          approved
        }
        enrichmentStatus
        contactProfile {
          webCard {
            userName
          }
        }
        ...contactHelpersShareContactData_contact
        ...useOnInviteContactDataQuery_contact
      }
    `,
    isSingleContact ? data : null,
  );

  const onInviteContact = useOnInviteContact();

  const removeContact = useRemoveContact();

  const webCardUserName = contact?.contactProfile?.webCard?.userName;

  const onShare = useShareContact();

  const elements = useMemo<ContactActionModalOptionProps[]>(() => {
    return [
      webCardUserName
        ? {
            icon: 'preview' as Icons,
            text: intl.formatMessage({
              defaultMessage: 'See WebCard',
              description:
                'ContactsScreen - More option alert - view contact webcard',
            }),
            onPress: async () => {
              const targetRoute = buildWebUrl(webCardUserName);
              const route = await matchUrlWithRoute(targetRoute);
              if (route) {
                router?.push(route);
              }
              close();
            },
          }
        : undefined,
      isSingleContact
        ? {
            icon: 'share' as Icons,
            text: intl.formatMessage({
              defaultMessage: 'Share Contact',
              description: 'ContactsScreen - More option alert - share',
            }),
            onPress: async () => {
              onShare(contact);
              close();
            },
            disabled:
              !contact ||
              contact.enrichmentStatus === 'running' ||
              contact.enrichmentStatus === 'pending' ||
              (contact.enrichmentStatus === 'completed' &&
                contact.enrichment?.approved === null),
          }
        : undefined,
      isSingleContact
        ? {
            icon: 'contact' as Icons,
            text: intl.formatMessage({
              defaultMessage: 'View Contact',
              description: 'ContactsScreen - More option alert - view',
            }),
            onPress: () => {
              if (contact?.id) {
                onShow(contact.id);
                close();
              }
            },
          }
        : undefined,
      {
        icon: 'invite' as Icons,
        text: intl.formatMessage({
          defaultMessage: "Save to my phone's Contact",
          description: 'ContactsScreen - More option alert - save',
        }),
        onPress: () => {
          if (contact) {
            onInviteContact(contact);
            close();
          }
        },
        disabled:
          !contact ||
          contact.enrichmentStatus === 'running' ||
          contact.enrichmentStatus === 'pending' ||
          (contact.enrichmentStatus === 'completed' &&
            contact.enrichment?.approved === null),
      },
    ].filter(isDefined);
  }, [
    close,
    contact,
    intl,
    isSingleContact,
    onInviteContact,
    onShare,
    onShow,
    router,
    webCardUserName,
  ]);

  const contactsDefined = Array.isArray(contact)
    ? contact.map(data => data.id)
    : [contact?.id];

  const onRemoveContactAction = data
    ? () => {
        if (data) {
          removeContact(contactsDefined);
        }
        close();
      }
    : undefined;

  const confirmDelete = () => {
    Alert.alert(
      intl.formatMessage(
        {
          defaultMessage: `Delete {count, plural,
          =1 {this contact}
          other {these contacts}
        }`,
          description: 'Title of delete contacts Alert',
        },
        {
          count: contactsDefined.length,
        },
      ),
      intl.formatMessage(
        {
          defaultMessage: `Are you sure you want to delete {count, plural,
          =1 {this contact}
          other {these contacts}
        }? This action is irreversible.`,
          description: 'description of delete contacts Alert',
        },
        {
          count: contactsDefined.length,
        },
      ),
      [
        {
          text: intl.formatMessage(
            {
              defaultMessage: `Delete {count, plural,
          =1 {this contact}
          other {these contacts}
        }`,
              description: 'button of delete contacts Alert',
            },
            {
              count: contactsDefined.length,
            },
          ),
          onPress: onRemoveContactAction,
          style: 'destructive',
        },
        {
          text: intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Cancel button of delete contacts Alert',
          }),
          onPress: close,
          isPreferred: true,
        },
      ],
    );
  };

  const contactsCount = Array.isArray(data) ? data?.length : 1;

  return (
    <BottomSheetModal
      index={0}
      visible={!!data}
      onDismiss={close}
      enablePanDownToClose
    >
      {elements.map((element, index) => {
        return <ContactActionModalOption key={index} {...element} />;
      })}
      <PressableNative style={styles.removeButton} onPress={confirmDelete}>
        <Text variant="button" style={styles.removeText}>
          <FormattedMessage
            defaultMessage="{contacts, plural,
                             =1 {Remove contact}
                             other {Remove contacts}}"
            description="ContactsScreen - More option alert - remove"
            values={{
              contacts: contactsCount,
            }}
          />
        </Text>
      </PressableNative>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  removeButton: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  removeText: {
    color: colors.red400,
  },
});

export default ContactActionModal;
