import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { isDefined } from '@azzapp/shared/isDefined';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { getAuthState } from '#helpers/authStore';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import ShareContact from '#helpers/ShareContact';
import useOnInviteContact from '#hooks/useOnInviteContact';
import useRemoveContact from '#hooks/useRemoveContact';
import BottomSheetModal from '#ui/BottomSheetModal';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactActionModalOption from './ContactActionModalOption';
import type { ContactType } from '#helpers/contactTypes';
import type { Icons } from '#ui/Icon';
import type { ContactActionModalOptionProps } from './ContactActionModalOption';
import type { ContactActionProps } from './ContactsScreenLists';

type ContactActionModalProps = {
  close: () => void;
  contactActionData?: ContactActionProps;
  onShow: (contact: ContactType) => void;
};

const ContactActionModal = ({
  contactActionData,
  close,
  onShow,
}: ContactActionModalProps) => {
  const intl = useIntl();
  const router = useRouter();
  const onInviteContact = useOnInviteContact();

  const removeContact = useRemoveContact();

  const onRemoveContacts = (contactIds: ContactType | ContactType[]) => {
    const profileId = getAuthState().profileInfos?.profileId;
    if (!profileId) {
      return;
    }
    const removedIds = (Array.isArray(contactIds) ? contactIds : [contactIds])
      .map(contact => contact.id)
      .filter(isDefined);

    removeContact(removedIds, profileId);
  };

  const onShowWebcard = useCallback(async () => {
    if (
      !contactActionData?.contact ||
      Array.isArray(contactActionData.contact)
    ) {
      return;
    }
    const targetRoute = buildWebUrl(contactActionData.contact?.webCardUserName);
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
      contactActionData?.contact.webCardUserName
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
      {
        icon: 'invite' as Icons,
        text: intl.formatMessage({
          defaultMessage: "Save to my phone's Contact",
          description: 'ContactsScreen - More option alert - save',
        }),
        onPress: () => {
          if (contactActionData?.contact) {
            onInviteContact(contactActionData.contact);
            close();
          }
        },
      },
    ].filter(isDefined);
  }, [
    close,
    contactActionData?.contact,
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
