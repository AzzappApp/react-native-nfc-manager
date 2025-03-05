import { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { FlatList, StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import { keyExtractor } from '#helpers/idHelpers';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactSearchByDateItem from './ContactSearchByDateItem';
import type { ContactType } from '#helpers/contactListHelpers';
import type { ContactActionProps } from './ContactsScreenLists';
import type {
  Contact,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';
import type { ListRenderItemInfo } from 'react-native';

type Props = {
  title: string;
  data: ContactType[];
  localContacts: Contact[];
  onInviteContact: (contact: ContactType, onHideInvitation: () => void) => void;
  onShowContact: (contact: ContactType) => void;
  contactsPermissionStatus: ContactPermissionStatus;
  showContactAction: (arg: ContactActionProps | undefined) => void;
};

const ContactSearchByDateSection = ({
  title,
  data,
  localContacts,
  onInviteContact,
  onShowContact,
  contactsPermissionStatus,
  showContactAction,
}: Props) => {
  const [invited, setInvited] = useState(false);

  const onMore = useCallback(() => {
    showContactAction({
      contact: data,
      showInvite: !invited,
      hideInvitation: () => setInvited(false),
    });
  }, [data, invited, showContactAction]);

  const RenderProfile = useCallback(
    ({ item }: ListRenderItemInfo<ContactType>) => {
      return (
        <ContactSearchByDateItem
          contact={item}
          onInviteContact={onHideInvitation => {
            onInviteContact(item, onHideInvitation);
          }}
          onShowContact={onShowContact}
          localContacts={localContacts}
          invited={invited}
          contactsPermissionStatus={contactsPermissionStatus}
          showContactAction={showContactAction}
        />
      );
    },
    [
      invited,
      localContacts,
      onInviteContact,
      onShowContact,
      contactsPermissionStatus,
      showContactAction,
    ],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <View>
          <Text variant="large">{title}</Text>
          <Text variant="small" style={styles.count}>
            <FormattedMessage
              defaultMessage="{contacts, plural,
              =0 {# contacts received}
              =1 {# contact received}
              other {# contacts received}
      }"
              description="ContactsScreenSearchByDate - Contacts counter under section by date"
              values={{ contacts: data.length }}
            />
          </Text>
        </View>
        <PressableNative onPress={onMore}>
          <Icon icon="more" />
        </PressableNative>
      </View>

      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={RenderProfile}
        horizontal
        contentContainerStyle={styles.profiles}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    color: colors.grey400,
    marginTop: 5,
  },
  profiles: {
    paddingLeft: 20,
    marginTop: 15,
    gap: 5,
  },
});

export default ContactSearchByDateSection;
