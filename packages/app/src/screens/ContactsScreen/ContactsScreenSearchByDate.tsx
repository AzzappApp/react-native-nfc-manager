import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, FlatList, Platform, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { keyExtractor } from '#helpers/idHelpers';
import useScreenInsets from '#hooks/useScreenInsets';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactSearchByDateItem from './ContactSearchByDateItem';
import type { ContactsScreen_contacts$data } from '#relayArtifacts/ContactsScreen_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';
import type { AlertButton, ListRenderItemInfo } from 'react-native';
import type { MMKV } from 'react-native-mmkv';

type Props = {
  contacts: ContactType[];
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onRemoveContacts: (contacts: string[]) => void;
  onInviteContact: (contact: ContactType, onHideInvitation: () => void) => void;
  storage: MMKV;
  localContacts: Contact[];
};

const ContactsScreenSearchByDate = ({
  contacts,
  onEndReached,
  onRefresh,
  refreshing,
  onRemoveContacts,
  onInviteContact,
  storage,
  localContacts,
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

  const RenderProfile = useCallback(
    ({ item }: ListRenderItemInfo<ContactType>) => {
      return (
        <ContactSearchByDateItem
          contact={item}
          onInviteContact={onHideInvitation => {
            onInviteContact(item, onHideInvitation);
          }}
          storage={storage}
          localContacts={localContacts}
        />
      );
    },
    [localContacts, onInviteContact, storage],
  );

  const RenderListItem = useCallback(
    ({ item }: ListRenderItemInfo<{ title: string; data: ContactType[] }>) => {
      const onInvite = () => {};

      const onRemove = () => {
        onRemoveContacts(item.data.map(({ id }) => id));
      };

      const onMore = () => {
        const options: AlertButton[] = [
          // {
          //   text: intl.formatMessage({
          //     defaultMessage: 'Share Contact',
          //     description: 'ContactsScreen - More option alert - share',
          //   }),
          //   onPress: () => {
          //     // @TODO: how to share without a pre-generated URL?
          //   },
          // },
          {
            text: intl.formatMessage({
              defaultMessage: 'Remove contacts',
              description: 'ContactsScreen - More option alert - remove',
            }),
            style: 'destructive',
            onPress: onRemove,
          },
          {
            text: intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'ContactsScreen - More option alert - cancel',
            }),
            style: 'cancel',
          },
        ];

        if (Platform.OS === 'ios') {
          options.unshift({
            text: intl.formatMessage({
              defaultMessage: "Save to my phone's Contacts",
              description: 'ContactsScreen - More option alert - save',
            }),
            onPress: onInvite,
          });
        }

        Alert.alert(
          intl.formatMessage(
            {
              defaultMessage: '{contacts} contacts',
              description:
                'ContactsScreenSearchByDate - Title for onMore alert',
            },
            { contacts: item.data.length },
          ),
          '',
          options,
        );
      };

      return (
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <View>
              <Text variant="large">{item.title}</Text>
              <Text variant="small" style={styles.count}>
                <FormattedMessage
                  defaultMessage="{contacts, plural,
                =0 {# Contacts}
                =1 {# Contact}
                other {# Contacts}
        }"
                  description="ContactsScreenSearchByDate - Contacts counter under section by date"
                  values={{ contacts: item.data.length }}
                />
              </Text>
            </View>
            <PressableNative onPress={onMore}>
              <Icon icon="more" />
            </PressableNative>
          </View>

          <FlatList
            data={item.data}
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
    },
    [RenderProfile, intl, onRemoveContacts, styles],
  );

  return (
    <FlatList
      data={sections}
      keyExtractor={sectionKeyExtractor}
      renderItem={RenderListItem}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={[{ paddingBottom: bottom }]}
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
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: theme === 'light' ? colors.grey50 : colors.grey900,
  },
  profiles: {
    paddingLeft: 20,
    marginTop: 15,
    gap: 5,
  },
}));

type ContactType = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<ContactsScreen_contacts$data['searchContacts']['edges']>
    >
  >['node']
>;

export default ContactsScreenSearchByDate;
