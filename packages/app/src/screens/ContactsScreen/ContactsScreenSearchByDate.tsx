import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import SectionContactsHorizontalList from '#components/Contact/SectionContactsHorizontalList';
import type { ContactType } from '#helpers/contactListHelpers';
import type { ContactActionProps } from './ContactsScreenLists';
import type {
  Contact,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';

type ContactsScreenSearchByDateProps = {
  contacts: ContactType[];
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onInviteContact: (contact: ContactType, onHideInvitation: () => void) => void;
  onShowContact: (contact: ContactType) => void;
  localContacts: Contact[];
  contactsPermissionStatus: ContactPermissionStatus;
  showContactAction: (arg: ContactActionProps | undefined) => void;
  listFooterComponent: JSX.Element;
};

const ContactsScreenSearchByDate = ({
  contacts,
  onEndReached,
  onRefresh,
  refreshing,
  onInviteContact,
  onShowContact,
  localContacts,
  contactsPermissionStatus,
  showContactAction,
  listFooterComponent,
}: ContactsScreenSearchByDateProps) => {
  const intl = useIntl();

  const sections = useMemo(() => {
    return contacts?.reduce(
      (accumulator, contact) => {
        const date = new Date(contact.createdAt);
        const isToday = date.toDateString() === new Date().toDateString();

        const title = isToday
          ? intl.formatMessage({
              defaultMessage: 'Today',
              description: 'ContactsScreenSearchByDate - Title for current day',
            })
          : date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

        const existingSection = accumulator.find(
          section => section.title === title,
        );

        if (!existingSection) {
          accumulator.push({ title, data: [contact] });
        } else {
          existingSection.data.push(contact);
        }

        return accumulator;
      },
      [] as Array<{ title: string; data: ContactType[] }>,
    );
  }, [contacts, intl]);

  return (
    <SectionContactsHorizontalList
      sections={sections}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onInviteContact={onInviteContact}
      onShowContact={onShowContact}
      localContacts={localContacts}
      contactsPermissionStatus={contactsPermissionStatus}
      showContactAction={showContactAction}
      listFooterComponent={listFooterComponent}
    />
  );
};

export default ContactsScreenSearchByDate;
