import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import SectionContactsHorizontalList from '#components/Contact/SectionContactsHorizontalList';
import { useRouter } from '#components/NativeRouter';
import { getFriendlyNameFromLocation } from '#helpers/contactHelpers';
import type { ContactType } from '#helpers/contactListHelpers';
import type { ContactActionProps } from './ContactsScreenLists';

type ContactsScreenSearchByLocationProps = {
  contacts: ContactType[];
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onShowContact: (contact: ContactType) => void;
  showContactAction: (arg: ContactActionProps | undefined) => void;
  listFooterComponent: JSX.Element;
};

const ContactsScreenSearchByLocation = ({
  contacts,
  onEndReached,
  onRefresh,
  refreshing,
  onShowContact,
  showContactAction,
  listFooterComponent,
}: ContactsScreenSearchByLocationProps) => {
  const intl = useIntl();

  const sections = useMemo(() => {
    return contacts
      ?.reduce(
        (accumulator, contact) => {
          const title =
            getFriendlyNameFromLocation(contact.meetingPlace) ??
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
      onShowContact={onShowContact}
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
