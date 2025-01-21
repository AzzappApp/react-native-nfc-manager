import * as Contacts from 'expo-contacts';
import { Image } from 'expo-image';
import { memo, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import IconButton from '#ui/IconButton';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { Contact } from 'expo-contacts';
import type { ListRenderItemInfo } from 'react-native';

type MultiUserAddListProps = {
  onAddSingleUser: (contact: Contact) => void;
  searchValue: string | null | undefined;
};

const MultiUserAddList = ({
  onAddSingleUser,
  searchValue,
}: MultiUserAddListProps) => {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);

  const formatDisplayName = (contact: Contacts.Contact) =>
    (contact.firstName && contact.lastName
      ? `${contact.firstName} ${contact.lastName}`
      : contact.firstName
        ? `${contact.firstName}`
        : contact.lastName
          ? `${contact.lastName}`
          : contact.name
            ? `${contact.name}`
            : ''
    ).trim();

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.FirstName,
            Contacts.Fields.LastName,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Image,
            Contacts.Fields.Birthday,
            Contacts.Fields.UrlAddresses,
            Contacts.Fields.SocialProfiles,
            Contacts.Fields.Emails,
            Contacts.Fields.Addresses,
          ],
        });

        if (data.length > 0) {
          setContacts(
            data.sort((a, b) => {
              return formatDisplayName(a).localeCompare(formatDisplayName(b));
            }),
          );
        }
      }
    })();
  }, []);

  const contactData = useMemo(() => {
    if (isNotFalsyString(searchValue)) {
      const searchLower = searchValue!.toLowerCase();
      return contacts.filter(contact => {
        return (
          (contact.name && contact.name.toLowerCase().includes(searchLower)) ||
          (contact.firstName &&
            contact.firstName.toLowerCase().includes(searchLower)) ||
          (contact.lastName &&
            contact.lastName.toLowerCase().includes(searchLower)) ||
          (contact.phoneNumbers &&
            contact.phoneNumbers.some(phone =>
              phone.number
                ?.toLowerCase()
                .replaceAll(' ', '')
                .includes(searchLower.replaceAll(' ', '')),
            )) ||
          (contact.emails &&
            contact.emails.some(email =>
              email.email?.toLowerCase().includes(searchLower),
            ))
        );
      });
    }
    return contacts;
  }, [contacts, searchValue]);

  const renderItem = ({ item }: ListRenderItemInfo<Contacts.Contact>) => {
    if (item) {
      const displayName = formatDisplayName(item);
      if (isNotFalsyString(displayName)) {
        return (
          <ContactItem
            displayName={displayName}
            item={item}
            onPress={onAddSingleUser}
          />
        );
      }
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <FlatList<Contacts.Contact>
        data={contactData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="always"
      />
    </KeyboardAvoidingView>
  );
};

const keyExtractor = (item: Contacts.Contact) => item.id ?? item.name;

const AVATAR_SIZE = 56;
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
    marginRight: 15,
    backgroundColor: colors.grey400,
  },
});

export default MultiUserAddList;

const ContactItemRender = ({
  displayName,
  item,
  onPress,
}: {
  displayName: string;
  item: Contacts.Contact;
  onPress: (item: Contacts.Contact) => void;
}) => {
  const selectUser = () => {
    onPress(item);
  };
  return (
    <PressableOpacity style={styles.contact} onPress={selectUser}>
      <View style={styles.placeholderAvatar}>
        {item.imageAvailable && item.image?.uri ? (
          <Image
            source={{ uri: item.image.uri }}
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
            }}
          />
        ) : (
          <View>
            <Text>{displayName.substring(0, 2)}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="large">{displayName}</Text>
      </View>
      <IconButton icon="add" size={35} onPress={selectUser} />
    </PressableOpacity>
  );
};

const ContactItem = memo(ContactItemRender);
