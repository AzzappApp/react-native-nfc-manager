import { useCallback, useMemo } from 'react';
import { SectionList, View } from 'react-native';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import Text from '#ui/Text';
import ContactSearchByNameItem from './ContactSearchByNameItem';
import type { ContactsScreenLists_contacts$data } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type {
  PermissionStatus as ContactPermissionStatus,
  Contact,
} from 'expo-contacts';
import type { SectionListData, SectionListRenderItemInfo } from 'react-native';
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

const ContactsScreenSearchByName = ({
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

  const sections = useMemo(() => {
    return contacts?.reduce(
      (accumulator, contact) => {
        const initial = contact.firstName?.[0] ?? '';

        const existingSection = accumulator.find(
          section => section.initial === initial,
        );

        if (!existingSection) {
          accumulator.push({ initial, data: [contact] });
        } else {
          existingSection.data.push(contact);
        }

        return accumulator;
      },
      [] as Array<{ initial: string; data: ContactType[] }>,
    );
  }, [contacts]);

  const renderHeaderSection = useCallback(
    ({
      section: { initial },
    }: {
      section: SectionListData<
        ContactType,
        { initial: string; data: ContactType[] }
      >;
    }) => {
      if (isNotFalsyString(initial)) {
        return <Text style={styles.title}>{initial}</Text>;
      }
      return null;
    },
    [styles.title],
  );

  const renderListItem = useCallback(
    ({
      item,
    }: SectionListRenderItemInfo<
      ContactType,
      { initial: string; data: ContactType[] }
    >) => {
      return (
        <ContactSearchByNameItem
          contact={item}
          onRemoveContact={onRemoveContacts}
          onInviteContact={onInviteContact}
          onShowContact={onShowContact}
          storage={storage}
          localContacts={localContacts}
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
    <SectionList
      accessibilityRole="list"
      sections={sections}
      keyExtractor={sectionKeyExtractor}
      renderItem={renderListItem}
      renderSectionHeader={renderHeaderSection}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingBottom: bottom }}
      ItemSeparatorComponent={ItemSeparator}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="always"
    />
  );
};

const sectionKeyExtractor = (item: { id: string }) => {
  return item.id;
};
const ItemSeparator = () => {
  const styles = useStyleSheet(stylesheet);
  return <View style={styles.separator} />;
};

const stylesheet = createStyleSheet(theme => ({
  title: {
    marginVertical: 20,
  },
  section: {
    margin: 20,
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

export default ContactsScreenSearchByName;
