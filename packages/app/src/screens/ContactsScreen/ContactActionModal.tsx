import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { isDefined } from '@azzapp/shared/isDefined';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
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

type ContactActionModalProps = {
  close: () => void;
  data?: ContactType | ContactType[];
  onShow: (contact: ContactType) => void;
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

  const onRemoveContacts = (contactIds: ContactType | ContactType[]) => {
    const removedIds = (Array.isArray(contactIds) ? contactIds : [contactIds])
      .map(contact => contact.id)
      .filter(isDefined);

    removeContact(removedIds);
  };

  const onShowWebcard = useCallback(async () => {
    if (!data || Array.isArray(data)) {
      return;
    }
    const targetRoute = buildWebUrl(data?.webCardUserName);
    const route = await matchUrlWithRoute(targetRoute);
    if (route) {
      router?.push(route);
    }
    close();
  }, [close, data, router]);

  const elements = useMemo<ContactActionModalOptionProps[]>(() => {
    const multiSelection = data && Array.isArray(data);
    return [
      data && !Array.isArray(data) && data.webCardUserName
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
              if (data && !Array.isArray(data)) {
                ShareContact(data);
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
              data && !Array.isArray(data) && onShow(data as ContactType),
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
            onInviteContact(data);
            close();
          }
        },
      },
    ].filter(isDefined);
  }, [close, data, intl, onInviteContact, onShow, onShowWebcard]);

  const onRemoveContactAction = data
    ? () => {
        if (data) onRemoveContacts(data);
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
