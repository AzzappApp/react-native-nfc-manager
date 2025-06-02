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
import ContactAvatar, { EnrichmentOverlay } from '../ContactAvatar';
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
        enrichmentStatus
        enrichment {
          approved
          fields {
            company
          }
        }
        contactProfile {
          webCard {
            userName
            ...CoverRenderer_webCard
          }
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

  const webCard = contact.contactProfile?.webCard;
  const [firstName, lastName, name] = useMemo(() => {
    if (contact.firstName || contact.lastName) {
      return [
        contact.firstName,
        contact.lastName,
        `${contact?.firstName ?? ''} ${contact?.lastName ?? ''}`.trim(),
      ];
    }

    if (webCard?.userName) {
      return [webCard.userName, '', webCard.userName];
    }

    return ['', '', ''];
  }, [contact.firstName, contact.lastName, webCard?.userName]);

  const enrichmentInProgress =
    contact.enrichmentStatus === 'running' ||
    contact.enrichmentStatus === 'pending';
  const enrichmentNeedApproval =
    contact.enrichmentStatus === 'completed' &&
    contact.enrichment?.approved === null;

  const location = getFriendlyNameFromLocation(contact.meetingPlace);
  return (
    <View key={contact.id}>
      <PressableNative
        onPress={onShow}
        onLongPress={onMore}
        style={styles.contactInfos}
      >
        {!avatarSource && webCard ? (
          <View style={styles.cover}>
            <CoverRenderer
              style={styles.webcard}
              width={COVER_WIDTH}
              webCard={webCard}
              large
            />
          </View>
        ) : (
          <ContactAvatar
            style={styles.webcard}
            firstName={firstName}
            lastName={lastName}
            name={name}
            company={contact.company}
            small
            avatar={avatarSource}
          />
        )}

        <EnrichmentOverlay
          overlayEnrichmentInProgress={enrichmentInProgress}
          overlayEnrichmentApprovementNeeded={enrichmentNeedApproval}
          small
          scale={0.4375}
          name={name}
          company={contact.enrichment?.fields?.company || contact.company}
        />
        <View style={styles.infos}>
          {(contact.firstName || contact.lastName) && (
            <Text variant="large" numberOfLines={1}>
              {`${contact?.firstName ?? ''} ${contact?.lastName ?? ''}`.trim()}
            </Text>
          )}
          {!contact.firstName && !contact.lastName && webCard?.userName && (
            <Text variant="large" numberOfLines={1}>
              {webCard?.userName}
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
          {!enrichmentNeedApproval && !enrichmentInProgress && (
            <WhatsappButton
              phoneNumbers={contact.phoneNumbers as ContactPhoneNumberType[]}
            />
          )}

          <IconButton variant="icon" icon="more" onPress={onMore} hitSlop={5} />
        </View>
      </PressableNative>
    </View>
  );
};

const GAP = 15;
const VERTICAL_PADDING = 20;

export const CONTACT_LIST_ITEM_HEIGHT =
  COVER_WIDTH / COVER_RATIO + VERTICAL_PADDING * 2;

const styles = StyleSheet.create({
  contactInfos: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    flex: 1,
    columnGap: GAP,
    height: CONTACT_LIST_ITEM_HEIGHT,
    alignItems: 'center',
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
