import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { usePreloadedQuery } from 'react-relay';
import { colors, textStyles } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import { MultiUserAddScreen_FindContactsQuery } from './MultiUserAddScreen';
import type { Contact } from './MultiUserAddScreen';
import type { CoverRenderer_webCard$key } from '@azzapp/relay/artifacts/CoverRenderer_webCard.graphql';
import type { MultiUserAddScreen_FindContactsQuery as Query } from '@azzapp/relay/artifacts/MultiUserAddScreen_FindContactsQuery.graphql';
import type { PreloadedQuery } from 'react-relay';

type AssociatedContact = {
  publishedWebCards: ReadonlyArray<CoverRenderer_webCard$key & { id: string }>;
  email?: string;
  phoneNumber?: string;
  local: Contact;
};

type MultiUserAddListProps = {
  azzappContacts: PreloadedQuery<Query>;
  localContacts: Contact[];
  onAddSingleUser: (
    associated: Pick<AssociatedContact, 'email' | 'phoneNumber'>,
    contact: Contact,
  ) => void;
};

const MultiUserAddList = (props: MultiUserAddListProps) => {
  const { azzappContacts, localContacts, onAddSingleUser } = props;
  const {
    viewer: { contacts, profile },
  } = usePreloadedQuery(MultiUserAddScreen_FindContactsQuery, azzappContacts);

  const sortedContacts: Record<string, AssociatedContact[]> = useMemo(() => {
    const alreadyInvited = profile?.webCard.profiles?.reduce(
      (accumulator, currentValue) => {
        const { email, phoneNumber } = currentValue.user;
        if (email) accumulator.emails.push(email);
        if (phoneNumber) accumulator.phoneNumbers.push(phoneNumber);

        return accumulator;
      },
      { emails: [] as string[], phoneNumbers: [] as string[] },
    );

    const sortedContacts = contacts?.reduce(
      (accumulator, contact) => {
        const contactToAssociate = localContacts.find(localContact => {
          return (
            (contact.email
              ? localContact.emails.find(({ email }) => email === contact.email)
              : false) ||
            (contact.phoneNumber
              ? localContact.phoneNumbers.find(
                  ({ number }) => number === contact.phoneNumber,
                )
              : false)
          );
        });

        if (contactToAssociate) {
          const associatedContact: AssociatedContact = {
            email: contact.email ?? undefined,
            phoneNumber: contact.phoneNumber ?? undefined,
            publishedWebCards: contact.publishedWebCards,
            local: contactToAssociate,
          };

          const alreadyExist =
            alreadyInvited?.emails.find(
              email => email === associatedContact.email,
            ) ||
            alreadyInvited?.phoneNumbers.find(
              phoneNumber => phoneNumber === associatedContact.phoneNumber,
            );

          if (!alreadyExist) {
            const initial = associatedContact.local.firstName.substring(0, 1);
            if (accumulator[initial])
              accumulator[initial].push(associatedContact);
            else accumulator[initial] = [associatedContact];
          }
        }
        return accumulator;
      },
      {} as Record<string, AssociatedContact[]>,
    );

    return sortedContacts ?? {};
  }, [contacts, localContacts, profile]);

  return (
    <View>
      {Object.entries(sortedContacts).map(([initial, contacts]) => (
        <View key={initial}>
          <Text style={[textStyles.large, styles.initial]}>{initial}</Text>
          {contacts.map((contact, index) => (
            <View style={styles.contact} key={index}>
              {contact.publishedWebCards.map((webCard, profileIndex) => (
                <CoverRenderer
                  key={webCard.id}
                  webCard={webCard}
                  width={COVER_WIDTHS[profileIndex] ?? 0}
                  style={{
                    position: 'relative',
                    left: COVER_LEFT[profileIndex],
                    zIndex: 3 - profileIndex,
                  }}
                />
              ))}
              <View
                style={[
                  styles.description,
                  {
                    marginLeft: COVER_MARGINS[contact.publishedWebCards.length],
                  },
                ]}
              >
                <Text style={textStyles.large}>
                  {contact.local.firstName} {contact.local.lastName}
                </Text>
                <Text style={[textStyles.small, styles.nbProfiles]}>
                  <FormattedMessage
                    defaultMessage="{nbWebCards} profiles"
                    description="Displayed number of profile in MultiUserAddList"
                    values={{ nbWebCards: contact.publishedWebCards.length }}
                  />
                </Text>
              </View>
              <IconButton
                icon="add"
                size={35}
                onPress={() =>
                  onAddSingleUser(
                    {
                      email: contact.email,
                      phoneNumber: contact.phoneNumber,
                    },
                    contact.local,
                  )
                }
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const COVER_WIDTHS = [35, 25, 14];
const COVER_LEFT = [0, -13, -19];
const COVER_MARGINS = [50, 35, 10];

const styles = StyleSheet.create({
  nbProfiles: {
    color: colors.grey400,
  },
  contact: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  description: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: 25,
    flex: 1,
  },
  initial: {
    marginTop: 20,
  },
});

export default MultiUserAddList;
