import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import SectionContactsHorizontalList from '#components/Contact/SectionContactsHorizontalList';
import type { ContactType } from '#helpers/contactTypes';
import type { ContactActionProps } from './ContactsScreenLists';

type ContactsScreenSearchByDateProps = {
  contacts: ContactType[];
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onShowContact: (contact: ContactType) => void;
  showContactAction: (arg: ContactActionProps | undefined) => void;
  listFooterComponent: JSX.Element;
};

const ContactsScreenSearchByDate = ({
  contacts,
  onEndReached,
  onRefresh,
  refreshing,
  onShowContact,
  showContactAction,
  listFooterComponent,
}: ContactsScreenSearchByDateProps) => {
  const intl = useIntl();

  const sections = useMemo(() => {
    const today = new Date().toDateString();
    return contacts?.reduce(
      (accumulator, contact) => {
        const date = new Date(contact.createdAt);
        const isToday = date.toDateString() === today;

        const title = isToday
          ? intl.formatMessage({
              defaultMessage: 'Today',
              description: 'Contacts by date - Title for current day',
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
      onShowContact={onShowContact}
      showContactAction={showContactAction}
      listFooterComponent={listFooterComponent}
      showLocationInSubtitle
    />
  );
};

export default ContactsScreenSearchByDate;
