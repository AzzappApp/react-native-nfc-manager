import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { isDefined } from '@azzapp/shared/isDefined';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import BottomSheetModal from '#ui/BottomSheetModal';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ContactType } from '#helpers/contactListHelpers';
import type { Icons } from '#ui/Icon';
import type { ContactActionProps } from './ContactsScreenLists';
import type { ReactNode } from 'react';

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
      // !multiSelection
      //   ? {
      //       icon: 'share' as Icons,
      //       text: intl.formatMessage({
      //         defaultMessage: 'Share Contact',
      //         description: 'ContactsScreen - More option alert - share',
      //       }),
      //       onPress: () => {
      //         // @TODO: how to share without a pre-generated URL?
      //       },
      //     }
      //   : undefined,
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

type ContactActionModalOptionProps = {
  icon: Icons;
  text: ReactNode;
  onPress: () => void;
};

const ContactActionModalOption = ({
  icon,
  text,
  onPress,
}: {
  icon: Icons;
  text: ReactNode;
  onPress: () => void;
}) => {
  const inner = (
    <PressableNative style={styles.bottomSheetOptionButton} onPress={onPress}>
      <View style={styles.bottomSheetOptionContainer}>
        <View style={styles.bottomSheetOptionIconLabel}>
          <Icon icon={icon} />
          <Text>{text}</Text>
        </View>
        <Icon icon="arrow_right" />
      </View>
    </PressableNative>
  );
  return inner;
};

const ROW_HEIGHT = 42;
const styles = StyleSheet.create({
  bottomSheetOptionButton: {
    paddingVertical: 5,
    paddingHorizontal: 20,
    height: ROW_HEIGHT,
    justifyContent: 'center',
  },
  bottomSheetOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  bottomSheetOptionIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
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
