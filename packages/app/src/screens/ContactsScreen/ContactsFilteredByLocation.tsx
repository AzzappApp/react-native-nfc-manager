import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import ContactsList from '#components/Contact/ContactsList';
import Text from '#ui/Text';
import type { ContactType } from '#helpers/contactTypes';
import type { ContactActionProps } from './ContactsScreenLists';
import type { SectionListData } from 'react-native';

type Props = {
  contacts: ContactType[];
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onShowContact: (contact: ContactType) => void;
  showContactAction: (arg: ContactActionProps | undefined) => void;
  listFooterComponent: JSX.Element;
};

const ContactsFilteredByLocation = ({
  contacts,
  onEndReached,
  onRefresh,
  refreshing,
  onShowContact,
  showContactAction,
  listFooterComponent,
}: Props) => {
  const intl = useIntl();

  const sections = useMemo(() => {
    const today = new Date().toDateString();
    return contacts?.reduce(
      (accumulator, contact) => {
        const date = new Date(contact.meetingDate);
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

  const renderHeaderSection = useCallback(
    ({
      section: { title, data },
    }: {
      section: SectionListData<
        ContactType,
        { title: string; data: ContactType[] }
      >;
    }) => {
      if (isNotFalsyString(title)) {
        return (
          <View style={styles.title}>
            <Text variant="large">{title}</Text>
            <Text variant="small">
              <FormattedMessage
                defaultMessage="{nbContacts} contacts"
                description="Number of contacts"
                values={{ nbContacts: data.length }}
              />
            </Text>
          </View>
        );
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
      showContactAction={showContactAction}
      listFooterComponent={listFooterComponent}
    />
  );
};

const styles = StyleSheet.create({
  title: {
    marginVertical: 20,
    rowGap: 5,
  },
});

export default ContactsFilteredByLocation;
