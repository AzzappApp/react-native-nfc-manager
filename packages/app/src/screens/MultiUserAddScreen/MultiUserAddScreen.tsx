import * as Contacts from 'expo-contacts';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, useQueryLoader } from 'react-relay';
import { formatBirthday } from '@azzapp/shared/timeHelpers';
import { textStyles } from '#theme';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import SearchBarStatic from '#ui/SearchBarStatic';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import MultiUserAddList from './MultiUserAddList';
import MultiUserAddModal from './MultiUserAddModal';
import type {
  AssociatedUser,
  MultiUserAddModalActions,
} from './MultiUserAddModal';
import type { MultiUserAddScreen_FindContactsQuery as Query } from '@azzapp/relay/artifacts/MultiUserAddScreen_FindContactsQuery.graphql';

export type Contact = {
  lastName: string;
  firstName: string;
  phoneNumbers: Array<{ label: string; number: string }>;
  emails: Array<{ label: string; email: string }>;
  birthday?: string;
  company?: string;
  socials?: Array<{ label: string; url: string }>;
  title?: string;
  urls?: string[];
};

export const MultiUserAddScreen_FindContactsQuery = graphql`
  query MultiUserAddScreen_FindContactsQuery(
    $emails: [String!]!
    $phoneNumbers: [String!]!
  ) {
    viewer {
      contacts(emails: $emails, phoneNumbers: $phoneNumbers) {
        email
        phoneNumber
        publishedWebCards {
          id
          ...CoverRenderer_webCard
        }
      }
      profile {
        webCard {
          profiles {
            user {
              email
              phoneNumber
            }
          }
        }
      }
    }
  }
`;

export const multiUserAddScreenQuery = graphql`
  query MultiUserAddScreenQuery {
    viewer {
      profile {
        id
      }
    }
  }
`;

const MultiUserAddScreen = () => {
  const intl = useIntl();
  const router = useRouter();

  const [searchValue, setSearchValue] = useState<string | undefined>('');
  const isSearchPhoneNumber = useMemo(() => {
    return isValidPhoneNumber(searchValue ?? '');
  }, [searchValue]);

  const [localContacts, setLocalContacts] = useState<Contact[]>([]);
  const [azzappContacts, fetchAzzappContacts, disposeFetchAzzappContacts] =
    useQueryLoader<Query>(MultiUserAddScreen_FindContactsQuery);

  const ref = useRef<MultiUserAddModalActions>(null);

  useEffect(() => {
    const getContacts = async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Emails,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Birthday,
            Contacts.Fields.Company,
            Contacts.Fields.SocialProfiles,
            Contacts.Fields.JobTitle,
            Contacts.Fields.UrlAddresses,
          ],
        });

        const { emails, phoneNumbers, contacts } = data.reduce(
          (accumulator, currentValue) => {
            const emails =
              (currentValue.emails
                ?.filter(email => email.email)
                .map(({ email, label }) => ({
                  email,
                  label,
                })) as Contact['emails']) ?? [];

            const phoneNumbers =
              currentValue.phoneNumbers?.reduce(
                (accumulator, currentValue) => {
                  const { number, label } = currentValue;

                  if (number && isValidPhoneNumber(number)) {
                    const formatedNumber =
                      parsePhoneNumber(number).formatInternational();
                    accumulator.push({ number: formatedNumber, label });
                  }

                  return accumulator;
                },
                [] as Contact['phoneNumbers'],
              ) ?? [];

            const socials = currentValue.socialProfiles
              ?.filter(({ url }) => url)
              .map(({ url, label }) => ({
                url,
                label: label ?? url,
              })) as Contact['socials'];

            const urls = currentValue.urlAddresses
              ?.filter(({ url }) => url)
              .map(({ url }) => url) as Contact['urls'];

            let formatedBirthday: string | undefined;

            if (currentValue.birthday) {
              const { year, month, day } = currentValue.birthday;
              if (year && day && typeof month === 'number') {
                formatedBirthday = formatBirthday(year, month, day);
              }
            }

            accumulator.contacts.push({
              firstName: currentValue.firstName ?? '',
              lastName: currentValue.lastName ?? '',
              phoneNumbers,
              emails,
              company: currentValue.company,
              socials,
              title: currentValue.jobTitle,
              urls,
              birthday: formatedBirthday,
            });

            accumulator.phoneNumbers.push(...phoneNumbers);
            accumulator.emails.push(...emails);

            return accumulator;
          },
          {
            contacts: [] as Contact[],
            phoneNumbers: [] as Contact['phoneNumbers'],
            emails: [] as Contact['emails'],
          },
        );

        setLocalContacts(contacts);
        fetchAzzappContacts({
          emails: emails.map(({ email }) => email),
          phoneNumbers: phoneNumbers.map(({ number }) => number),
        });
      }

      if (status === 'denied') {
        onAddSingleUser(
          {},
          {
            emails: [],
            firstName: '',
            lastName: '',
            phoneNumbers: [],
          },
        );
      }
    };

    getContacts();
  }, [fetchAzzappContacts]);

  useEffect(() => {
    return () => {
      disposeFetchAzzappContacts();
    };
  }, [disposeFetchAzzappContacts]);

  const onAddSingleUser = (associated: AssociatedUser, contact: Contact) => {
    const user = {
      emails: contact.emails.map(({ email }) => email),
      firstName: contact.firstName,
      lastName: contact.lastName,
      phoneNumbers: contact.phoneNumbers.map(({ number }) => number),
      contactCard: {
        emails: contact.emails.map(({ email, label }, i) => ({
          label,
          address: email,
          selected: i === 0,
        })),
        phoneNumbers: contact.phoneNumbers.map(({ number, label }, i) => ({
          label,
          number,
          selected: i === 0,
        })),
        firstName: contact.firstName,
        lastName: contact.lastName,
        addresses: [],
        birthday: contact.birthday
          ? {
              birthday: contact.birthday,
              selected: true,
            }
          : undefined,
        company: contact.company,
        socials: contact.socials,
        title: contact.title,
        urls: contact.urls?.map((url, i) => ({
          address: url,
          selected: i === 0,
        })),
      },
    };

    ref.current?.open(associated, user);
  };

  return (
    <>
      <Container style={{ flex: 1 }}>
        <SafeAreaView
          style={{ flex: 1 }}
          edges={{ bottom: 'off', top: 'additive' }}
        >
          <Header
            middleElement={intl.formatMessage({
              defaultMessage: 'Add users',
              description: 'MultiUserAddScreen - title',
            })}
            leftElement={
              <IconButton
                icon="arrow_left"
                onPress={router.back}
                iconSize={28}
                variant="icon"
              />
            }
          />
          <ScrollView style={{ flex: 1, padding: 10 }}>
            <SearchBarStatic
              onChangeText={setSearchValue}
              value={searchValue}
              placeholder={intl.formatMessage({
                defaultMessage: 'Search or enter email/phone number',
                description: 'Search Label for MultiUserAddScreen',
              })}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {/* {!searchValue && (
              <PressableNative style={styles.addList} onPress={onAddListUser}>
                <Icon icon="invite" />
                <Text style={styles.addListText}>
                  <FormattedMessage
                    defaultMessage="Add a list of users"
                    description="Section to open list of users inside MultiUserAddScreen"
                  />
                </Text>
                <Icon icon="arrow_right" />
              </PressableNative>
            )} */}

            <Separation style={styles.contactsSection}>
              {searchValue ? (
                <FormattedMessage
                  defaultMessage="New user"
                  description="Section to search users inside MultiUserAddScreen"
                />
              ) : (
                <FormattedMessage
                  defaultMessage="Contacts on azzapp"
                  description="Section to open list of users inside MultiUserAddScreen"
                />
              )}
            </Separation>

            {!searchValue && azzappContacts && (
              <Suspense fallback={<View />}>
                <MultiUserAddList
                  localContacts={localContacts}
                  azzappContacts={azzappContacts}
                  onAddSingleUser={onAddSingleUser}
                />
              </Suspense>
            )}

            {searchValue && (
              <View style={styles.searchUser}>
                <Text style={textStyles.large}>{searchValue}</Text>
                <IconButton
                  icon="add"
                  size={35}
                  onPress={() =>
                    onAddSingleUser(
                      {
                        email: isSearchPhoneNumber ? undefined : searchValue,
                        phoneNumber: isSearchPhoneNumber
                          ? searchValue
                          : undefined,
                      },
                      {
                        emails: isSearchPhoneNumber
                          ? []
                          : [{ label: 'Main', email: searchValue }],
                        firstName: '',
                        lastName: '',
                        phoneNumbers: isSearchPhoneNumber
                          ? [{ label: 'Main', number: searchValue }]
                          : [],
                      },
                    )
                  }
                />
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Container>
      <MultiUserAddModal beforeClose={() => setSearchValue('')} ref={ref} />
    </>
  );
};

const styles = StyleSheet.create({
  addList: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  addListText: {
    flex: 1,
    marginLeft: 10,
  },
  contactsSection: {
    marginTop: 20,
  },
  searchUser: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
});

export default relayScreen(MultiUserAddScreen, {
  query: multiUserAddScreenQuery,
});
