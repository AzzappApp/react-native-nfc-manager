import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { FlatList, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ContactSearchByDateSection from './ContactSearchByDateSection';
import type { ContactType } from '#helpers/contactListHelpers';
import type { ContactActionProps } from './ContactsScreenLists';
import type {
  Contact,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';
import type { ListRenderItemInfo } from 'react-native';

type Props = {
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
}: Props) => {
  const styles = useStyleSheet(stylesheet);

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

  const RenderListItem = useCallback(
    ({ item }: ListRenderItemInfo<{ title: string; data: ContactType[] }>) => {
      return (
        <ContactSearchByDateSection
          data={item.data}
          localContacts={localContacts}
          onInviteContact={onInviteContact}
          onShowContact={onShowContact}
          title={item.title}
          contactsPermissionStatus={contactsPermissionStatus}
          showContactAction={showContactAction}
        />
      );
    },
    [
      contactsPermissionStatus,
      localContacts,
      onInviteContact,
      onShowContact,
      showContactAction,
    ],
  );

  return (
    <FlatList
      data={sections}
      keyExtractor={sectionKeyExtractor}
      renderItem={RenderListItem}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      snapToAlignment="start"
      decelerationRate="fast"
      scrollEventThrottle={16}
      nestedScrollEnabled
      ItemSeparatorComponent={RenderSectionSeparator}
      ListFooterComponent={listFooterComponent}
    />
  );
};

const sectionKeyExtractor = (item: { title: string }) => {
  return item.title;
};

const RenderSectionSeparator = () => {
  const styles = useStyleSheet(stylesheet);
  return <View style={styles.separator} />;
};

const stylesheet = createStyleSheet(appearance => ({
  flex: { flex: 1 },
  content: {
    marginHorizontal: 10,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
  },
}));

export default ContactsScreenSearchByDate;
