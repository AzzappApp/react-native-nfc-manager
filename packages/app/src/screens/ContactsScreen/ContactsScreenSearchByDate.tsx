import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { FlatList, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import ContactSearchByDateSection from './ContactSearchByDateSection';
import type { ContactsScreenLists_contacts$data } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type {
  Contact,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';
import type { ListRenderItemInfo } from 'react-native';
import type { MMKV } from 'react-native-mmkv';

type Props = {
  contacts: ContactType[];
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onRemoveContacts: (contacts: string[]) => void;
  onInviteContact: (contact: ContactType, onHideInvitation: () => void) => void;
  onShowContact: (contact: ContactType) => void;
  storage: MMKV;
  localContacts: Contact[];
  contactsPermissionStatus: ContactPermissionStatus;
};

const ContactsScreenSearchByDate = ({
  contacts,
  onEndReached,
  onRefresh,
  refreshing,
  onRemoveContacts,
  onInviteContact,
  onShowContact,
  storage,
  localContacts,
  contactsPermissionStatus,
}: Props) => {
  const { bottom } = useScreenInsets();
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
          : date.toLocaleDateString('en-us', {
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
          onRemoveContacts={onRemoveContacts}
          onShowContact={onShowContact}
          storage={storage}
          title={item.title}
          contactsPermissionStatus={contactsPermissionStatus}
        />
      );
    },
    [
      contactsPermissionStatus,
      localContacts,
      onInviteContact,
      onRemoveContacts,
      onShowContact,
      storage,
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
      contentContainerStyle={[{ paddingBottom: bottom }, styles.content]}
      showsVerticalScrollIndicator={false}
      snapToAlignment="start"
      decelerationRate="fast"
      scrollEventThrottle={16}
      nestedScrollEnabled
      ItemSeparatorComponent={RenderSectionSeparator}
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

const stylesheet = createStyleSheet(theme => ({
  content: {
    marginHorizontal: 10,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: theme === 'light' ? colors.grey50 : colors.grey900,
  },
}));

type ContactType = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<
        ContactsScreenLists_contacts$data['searchContacts']['edges']
      >
    >
  >['node']
>;

export default ContactsScreenSearchByDate;
