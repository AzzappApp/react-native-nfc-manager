import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { isDefined } from '@azzapp/shared/isDefined';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import useOnInviteContact from '#components/Contact/useOnInviteContact';
import { useRouter } from '#components/NativeRouter';
import { readContactData, shareContact } from '#helpers/contactHelpers';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import useRemoveContact from '#hooks/useRemoveContact';
import BottomSheetModal from '#ui/BottomSheetModal';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactActionModalOption from './ContactActionModalOption';
import type { contactHelpersReadContactData$key } from '#relayArtifacts/contactHelpersReadContactData.graphql';
import type { Icons } from '#ui/Icon';
import type { ContactActionModalOptionProps } from './ContactActionModalOption';

type ContactActionModalProps = {
  close: () => void;
  data?:
    | contactHelpersReadContactData$key
    | contactHelpersReadContactData$key[];
  onShow: (contactId: string) => void;
};

const ContactActionModal = ({
  data,
  close,
  onShow,
}: ContactActionModalProps) => {
  const intl = useIntl();
  const router = useRouter();
  const onInviteContact = useOnInviteContact();

  const removeContact = useRemoveContact();
  const singleContact = useMemo(
    () => (data && !Array.isArray(data) ? readContactData(data) : null),
    [data],
  );
  const webCardUserName = singleContact?.webCardUserName;
  const contacts = useMemo(
    () =>
      (data && Array.isArray(data)
        ? data.map(readContactData)
        : [singleContact]
      ).filter(contact => !!contact),
    [data, singleContact],
  );

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
      singleContact
        ? {
            icon: 'share' as Icons,
            text: intl.formatMessage({
              defaultMessage: 'Share Contact',
              description: 'ContactsScreen - More option alert - share',
            }),
            onPress: async () => {
              shareContact(singleContact);
              close();
            },
          }
        : undefined,
      singleContact
        ? {
            icon: 'contact' as Icons,
            text: intl.formatMessage({
              defaultMessage: 'View Contact',
              description: 'ContactsScreen - More option alert - view',
            }),
            onPress: () => {
              if (singleContact.id) {
                onShow(singleContact.id);
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
          if (data) {
            onInviteContact(contacts);
            close();
          }
        },
      },
    ].filter(isDefined);
  }, [
    close,
    contacts,
    data,
    intl,
    onInviteContact,
    onShow,
    router,
    singleContact,
    webCardUserName,
  ]);

  const onRemoveContactAction = data
    ? () => {
        removeContact(contacts.map(contact => contact.id).filter(isDefined));
        close();
      }
    : undefined;

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
      <PressableNative
        style={styles.removeButton}
        onPress={onRemoveContactAction}
      >
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
