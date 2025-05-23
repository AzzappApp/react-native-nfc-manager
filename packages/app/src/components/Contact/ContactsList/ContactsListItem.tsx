import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, textStyles } from '#theme';
import useImageFromContact from '#components/Contact/useImageFromContact';
import CoverRenderer from '#components/CoverRenderer';
import { getFriendlyNameFromLocation } from '#helpers/contactHelpers';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactAvatar from '../ContactAvatar';
import WhatsappButton from '../WhatsappButton';
import type { ContactPhoneNumberType } from '#helpers/contactHelpers';
import type { ContactsListItem_contact$key } from '#relayArtifacts/ContactsListItem_contact.graphql';

type ContactsListItemProps = {
  contact: ContactsListItem_contact$key;
  onShowContact: (contactId: string) => void;
  onShowContactAction: (contactId: string) => void;
};

const COVER_WIDTH = 35;

const ContactsListItem = ({
  contact: contactKey,
  onShowContact,
  onShowContactAction,
}: ContactsListItemProps) => {
  const contact = useFragment(
    graphql`
      fragment ContactsListItem_contact on Contact {
        id
        firstName
        lastName
        company
        phoneNumbers {
          number
          label
        }
        meetingDate
        meetingPlace {
          city
          country
          region
          subregion
        }
        webCard {
          userName
          ...CoverRenderer_webCard
        }
        ...useImageFromContact_contact
      }
    `,
    contactKey,
  );

  const onShow = useCallback(() => {
    onShowContact(contact.id);
  }, [contact, onShowContact]);

  const onMore = useCallback(() => {
    onShowContactAction(contact.id);
  }, [contact, onShowContactAction]);

  const avatarSource = useImageFromContact(contact);

  const [firstname, lastname, name] = useMemo(() => {
    if (contact.firstName || contact.lastName) {
      return [
        contact.firstName,
        contact.lastName,
        `${contact?.firstName ?? ''} ${contact?.lastName ?? ''}`.trim(),
      ];
    }

    if (contact.webCard?.userName) {
      return [contact.webCard.userName, '', contact.webCard.userName];
    }

    return ['', '', ''];
  }, [contact.firstName, contact.lastName, contact.webCard?.userName]);

  const location = getFriendlyNameFromLocation(contact.meetingPlace);
  return (
    <View key={contact.id}>
      <PressableNative
        onPress={onShow}
        onLongPress={onMore}
        style={styles.contactInfos}
      >
        {!avatarSource && contact.webCard ? (
          <View style={styles.cover}>
            <CoverRenderer
              style={styles.webcard}
              width={COVER_WIDTH}
              webCard={contact.webCard}
              large
            />
          </View>
        ) : (
          <ContactAvatar
            style={styles.webcard}
            firstName={firstname}
            lastName={lastname}
            name={name}
            company={contact.company}
            small
            avatar={avatarSource}
          />
        )}
        <View style={styles.infos}>
          {(contact.firstName || contact.lastName) && (
            <Text variant="large" numberOfLines={1}>
              {`${contact?.firstName ?? ''} ${contact?.lastName ?? ''}`.trim()}
            </Text>
          )}
          {!contact.firstName &&
            !contact.lastName &&
            contact.webCard?.userName && (
              <Text variant="large" numberOfLines={1}>
                {contact.webCard?.userName}
              </Text>
            )}
          {contact.company && <Text numberOfLines={1}>{contact.company}</Text>}
          <Text style={(textStyles.small, styles.date)} numberOfLines={1}>
            {contact.meetingDate
              ? new Date(contact.meetingDate).toLocaleDateString()
              : null}
            {location ? ` - ${location}` : ''}
          </Text>
        </View>
        <View style={styles.actions}>
          <WhatsappButton
            phoneNumbers={contact.phoneNumbers as ContactPhoneNumberType[]}
          />
          <IconButton variant="icon" icon="more" onPress={onMore} hitSlop={5} />
        </View>
      </PressableNative>
    </View>
  );
};

const GAP = 15;

const styles = StyleSheet.create({
  contactInfos: {
    paddingHorizontal: 10,
    paddingVertical: 20,
    flexDirection: 'row',
    flex: 1,
    columnGap: GAP,
  },
  date: {
    color: colors.grey400,
  },
  cover: {
    width: COVER_WIDTH,
    borderRadius: 4,
    overflow: 'hidden',
  },
  webcard: {
    columnGap: GAP,
  },
  infos: {
    justifyContent: 'center',
    flex: 1,
    rowGap: 5,
    height: COVER_WIDTH / COVER_RATIO,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: GAP,
  },
});

export default ContactsListItem;
