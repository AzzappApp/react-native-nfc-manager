import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FlatList, StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import { keyExtractor } from '#helpers/idHelpers';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactHorizontalItem from './ContactHorizontalItem';
import type { ContactType } from '#helpers/contactListHelpers';
import type { ContactActionProps } from '../../../screens/ContactsScreen/ContactsScreenLists';
import type {
  Contact,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';
import type { ListRenderItemInfo } from 'react-native';

type ContactsScreenSectionProps = {
  title: string;
  data: ContactType[];
  localContacts: Contact[];
  onShowContact: (contact: ContactType) => void;
  contactsPermissionStatus: ContactPermissionStatus;
  showContactAction: (arg: ContactActionProps | undefined) => void;
  onPressAll?: (title: string) => void;
};

const ContactsScreenSection = ({
  title,
  data,
  localContacts,
  onShowContact,
  contactsPermissionStatus,
  showContactAction,
  onPressAll,
}: ContactsScreenSectionProps) => {
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
        <ContactHorizontalItem
          contact={item}
          onShowContact={onShowContact}
          localContacts={localContacts}
          contactsPermissionStatus={contactsPermissionStatus}
          showContactAction={showContactAction}
        />
      );
    },
    [localContacts, onShowContact, contactsPermissionStatus, showContactAction],
  );

  const intl = useIntl();

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
              description="ContactsScreen - Contacts counter under section by location or date"
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
      {onPressAll ? (
        <View style={styles.seeAll}>
          <Button
            variant="little_round"
            label={intl.formatMessage({
              defaultMessage: 'See all',
              description: 'See all found contacts',
            })}
            onPress={() => onPressAll?.(title)}
          />
        </View>
      ) : null}
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
  seeAll: {
    position: 'absolute',
    right: 12,
    top: '40%',
  },
});

export default ContactsScreenSection;
