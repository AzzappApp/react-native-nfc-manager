import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import SectionContactsHorizontalList from '#components/Contact/SectionContactsHorizontalList';
import { useRouter } from '#components/NativeRouter';
import type { ContactType } from '#helpers/contactListHelpers';
import type { ContactActionProps } from './ContactsScreenLists';
import type {
  Contact,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';

type ContactsScreenSearchByLocationProps = {
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

const ContactsScreenSearchByLocation = ({
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
}: ContactsScreenSearchByLocationProps) => {
  const intl = useIntl();

  const sections = useMemo(() => {
    return contacts
      ?.reduce(
        (accumulator, contact) => {
          const title =
            (contact.meetingPlace?.city ||
              contact.meetingPlace?.subregion ||
              contact.meetingPlace?.region ||
              contact.meetingPlace?.country) ??
            intl.formatMessage({
              defaultMessage: 'Unknown',
              description:
                'ContactsScreenSearchByLocation - Title for unknown location',
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
      )
      .sort((item1, item2) =>
        item1.title.toLowerCase() > item2.title.toLowerCase() ? 1 : -1,
      );
  }, [contacts, intl]);

  const router = useRouter();

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
      onPressAll={location => {
        router.push({
          route: 'CONTACTS_BY_LOCATION',
          params: { location },
        });
      }}
    />
  );
};

export default ContactsScreenSearchByLocation;
