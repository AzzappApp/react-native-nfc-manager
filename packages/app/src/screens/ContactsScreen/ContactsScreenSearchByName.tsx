import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import ContactsList from '#components/Contact/ContactsList';
import Text from '#ui/Text';
import type { ContactType } from '#helpers/contactListHelpers';
import type { ContactActionProps } from './ContactsScreenLists';
import type {
  PermissionStatus as ContactPermissionStatus,
  Contact,
} from 'expo-contacts';
import type { SectionListData } from 'react-native';

type Props = {
  contacts: ContactType[];
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onShowContact: (contact: ContactType) => void;
  localContacts: Contact[];
  contactsPermissionStatus: ContactPermissionStatus;
  showContactAction: (arg: ContactActionProps | undefined) => void;
  listFooterComponent: JSX.Element;
};

const ContactsScreenSearchByName = ({
  contacts,
  onEndReached,
  onRefresh,
  refreshing,
  onShowContact,
  localContacts,
  contactsPermissionStatus,
  showContactAction,
  listFooterComponent,
}: Props) => {
  const sections = useMemo(() => {
    return contacts.reduce(
      (accumulator, contact) => {
        const initial = (
          contact.firstName?.[0] ??
          contact.lastName?.[0] ??
          contact.company?.[0] ??
          contact.contactProfile?.webCard?.userName?.[0] ??
          ''
        ).toLocaleUpperCase();

        const existingSection = accumulator.find(
          section => section.title === initial,
        );

        if (!existingSection) {
          accumulator.push({ title: initial, data: [contact] });
        } else {
          existingSection.data.push(contact);
        }

        return accumulator;
      },
      [] as Array<{ title: string; data: ContactType[] }>,
    );
  }, [contacts]);

  const renderHeaderSection = useCallback(
    ({
      section: { title },
    }: {
      section: SectionListData<
        ContactType,
        { title: string; data: ContactType[] }
      >;
    }) => {
      if (isNotFalsyString(title)) {
        return <Text style={styles.title}>{title}</Text>;
      }
      return null;
    },
    [],
  );

  return (
    <ContactsList
      sections={sections}
      renderSectionHeader={renderHeaderSection}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onShowContact={onShowContact}
      localContacts={localContacts}
      contactsPermissionStatus={contactsPermissionStatus}
      showContactAction={showContactAction}
      listFooterComponent={listFooterComponent}
    />
  );
};

const styles = StyleSheet.create({
  title: {
    marginVertical: 20,
    textTransform: 'uppercase',
  },
});

export default ContactsScreenSearchByName;
