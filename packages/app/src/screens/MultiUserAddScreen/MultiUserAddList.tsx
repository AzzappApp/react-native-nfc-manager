import { FlashList } from '@shopify/flash-list';
import * as Contacts from 'expo-contacts';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { getContactsAsync } from '#helpers/getLocalContactsMap';
import IconButton from '#ui/IconButton';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import type { Contact } from 'expo-contacts';

const PAGE_SIZE = 50;
const MIN_SEARCH_RESULTS = 10;

type MultiUserAddListProps = {
  onAddSingleUser: (contact: Contact) => void;
  searchValue: string | null | undefined;
};

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

const MultiUserAddList = ({
  onAddSingleUser,
  searchValue,
}: MultiUserAddListProps) => {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const pageOffset = useRef(0);

  const loadNextPage = useRef(false);
  const hasNextPage = useRef(true);

  const loadContacts = useCallback(async () => {
    if (loadNextPage.current || !hasNextPage.current) return;
    loadNextPage.current = true;
    setIsLoading(true);

    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const { data, hasNextPage: hasNextPageValue } = await getContactsAsync({
        pageSize: PAGE_SIZE,
        pageOffset: pageOffset.current,
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
        sort: Contacts.SortTypes.FirstName,
      });

      if (data.length > 0) {
        setContacts(prev =>
          [...prev, ...data].sort((a, b) =>
            formatDisplayName(a).localeCompare(formatDisplayName(b)),
          ),
        );
        pageOffset.current += PAGE_SIZE;
      }
      hasNextPage.current = hasNextPageValue;
    }

    setIsLoading(false);
    loadNextPage.current = false;
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

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

  useEffect(() => {
    if (
      isNotFalsyString(searchValue) &&
      contactData.length < MIN_SEARCH_RESULTS
    ) {
      loadContacts();
    }
  }, [contactData, loadContacts, searchValue]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Contacts.Contact>) => {
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
    },
    [onAddSingleUser],
  );

  const ListFooterComponent = useMemo(
    () => <ListLoadingFooter loading={isLoading} />,
    [isLoading],
  );

  return (
    <FlashList
      data={contactData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={76}
      onEndReached={loadContacts}
      onEndReachedThreshold={0.2}
      keyboardShouldPersistTaps="always"
      ListFooterComponent={ListFooterComponent}
      renderScrollComponent={KeyboardAwareScrollView}
    />
  );
};

const keyExtractor = (item: Contacts.Contact) =>
  item.id ?? formatDisplayName(item);

const AVATAR_SIZE = 56;
const styles = StyleSheet.create({
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
