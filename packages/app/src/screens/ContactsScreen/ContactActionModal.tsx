import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { isDefined } from '@azzapp/shared/isDefined';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import ShareContact from '#helpers/ShareContact';
import BottomSheetModal from '#ui/BottomSheetModal';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactActionModalOption from './ContactActionModalOption';
import type { ContactType } from '#helpers/contactListHelpers';
import type { Icons } from '#ui/Icon';
import type { ContactActionModalOptionProps } from './ContactActionModalOption';
import type { ContactActionProps } from './ContactsScreenLists';

type ContactActionModalProps = {
  close: () => void;

  onRemoveContacts: (contacts: ContactType | ContactType[]) => void;

  contactActionData?: ContactActionProps;

  onInviteContact: (
    contact: ContactType | ContactType[],
    onHideInvitation: () => void,
  ) => void;
  onShow: (contact: ContactType) => void;
};

const ContactActionModal = ({
  contactActionData,
  close,
  onRemoveContacts,
  onInviteContact,
  onShow,
}: ContactActionModalProps) => {
  const intl = useIntl();
  const router = useRouter();

  const onShowWebcard = useCallback(async () => {
    if (
      !contactActionData?.contact ||
      Array.isArray(contactActionData.contact)
    ) {
      return;
    }
    const targetRoute = `${process.env.NEXT_PUBLIC_URL}/${contactActionData.contact?.contactProfile?.webCard?.userName}`;
    const route = await matchUrlWithRoute(targetRoute);
    if (route) {
      router?.push(route);
    }
    close();
  }, [close, contactActionData?.contact, router]);

  const elements = useMemo<ContactActionModalOptionProps[]>(() => {
    const multiSelection =
      contactActionData?.contact && Array.isArray(contactActionData.contact);
    return [
      contactActionData?.contact &&
      !Array.isArray(contactActionData.contact) &&
      contactActionData?.contact?.contactProfile?.webCard?.userName
        ? {
            icon: 'preview' as Icons,
            text: intl.formatMessage({
              defaultMessage: 'See WebCard',
              description:
                'ContactsScreen - More option alert - view contact webcard',
            }),
            onPress: onShowWebcard,
          }
        : undefined,
      !multiSelection
        ? {
            icon: 'share' as Icons,
            text: intl.formatMessage({
              defaultMessage: 'Share Contact',
              description: 'ContactsScreen - More option alert - share',
            }),
            onPress: async () => {
              if (
                contactActionData?.contact &&
                !Array.isArray(contactActionData?.contact)
              ) {
                ShareContact(contactActionData?.contact);
              }
            },
          }
        : undefined,
      !multiSelection
        ? {
            icon: 'contact' as Icons,
            text: intl.formatMessage({
              defaultMessage: 'View Contact',
              description: 'ContactsScreen - More option alert - view',
            }),
            onPress: () =>
              contactActionData?.contact &&
              !Array.isArray(contactActionData?.contact) &&
              onShow(contactActionData?.contact as ContactType),
          }
        : undefined,
      contactActionData?.showInvite || multiSelection
        ? {
            icon: 'invite' as Icons,
            text: intl.formatMessage({
              defaultMessage: "Save to my phone's Contact",
              description: 'ContactsScreen - More option alert - save',
            }),
            onPress: () => {
              if (contactActionData.contact)
                onInviteContact(contactActionData.contact, close);
            },
          }
        : undefined,
    ].filter(isDefined);
  }, [
    close,
    contactActionData?.contact,
    contactActionData?.showInvite,
    intl,
    onInviteContact,
    onShow,
    onShowWebcard,
  ]);

  const onRemoveContactAction = contactActionData?.contact
    ? () => {
        if (contactActionData?.contact)
          onRemoveContacts(contactActionData?.contact);
        close();
      }
    : undefined;

  const contactsCount = Array.isArray(contactActionData?.contact)
    ? contactActionData?.contact?.length
    : 1;

  return (
    <BottomSheetModal
      index={0}
      visible={!!contactActionData}
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
