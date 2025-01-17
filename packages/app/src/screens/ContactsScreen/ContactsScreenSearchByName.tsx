import { useCallback, useMemo } from 'react';
import { SectionList, View } from 'react-native';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import Text from '#ui/Text';
import ContactSearchByNameItem from './ContactSearchByNameItem';
import type { ContactType } from '#helpers/contactListHelpers';
import type { ContactActionProps } from './ContactsScreenLists';
import type {
  PermissionStatus as ContactPermissionStatus,
  Contact,
} from 'expo-contacts';
import type { SectionListData, SectionListRenderItemInfo } from 'react-native';

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
};

const ContactsScreenSearchByName = ({
  contacts,
  onEndReached,
  onRefresh,
  refreshing,
  onInviteContact,
  onShowContact,
  localContacts,
  contactsPermissionStatus,
  showContactAction,
}: Props) => {
  const { bottom } = useScreenInsets();
  const styles = useStyleSheet(stylesheet);

  const sections = useMemo(() => {
    return contacts.reduce(
      (accumulator, contact) => {
        const initial =
          contact.firstName?.[0] ??
          contact.lastName?.[0] ??
          contact.company?.[0] ??
          contact.contactProfile?.webCard?.userName?.[0] ??
          '';

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
          onInviteContact={onInviteContact}
          onShowContact={onShowContact}
          localContacts={localContacts}
          contactsPermissionStatus={contactsPermissionStatus}
          showContactAction={showContactAction}
        />
      );
    },
    [
      showContactAction,
      contactsPermissionStatus,
      localContacts,
      onInviteContact,
      onShowContact,
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
      contentContainerStyle={[{ paddingBottom: bottom }, styles.content]}
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
  content: {
    paddingHorizontal: 10,
  },
  title: {
    marginVertical: 20,
    textTransform: 'uppercase',
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

export default ContactsScreenSearchByName;
