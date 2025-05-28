import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import useImageFromContact from '#components/Contact/useImageFromContact';
import WhatsappButton from '#components/Contact/WhatsappButton';
import CoverRenderer from '#components/CoverRenderer';
import PressableNative from '#ui/PressableNative';
import ContactAvatar, { EnrichmentOverlay } from '../ContactAvatar';
import type { ContactPhoneNumberType } from '#helpers/contactHelpers';
import type { ContactHorizontalItem_contact$key } from '#relayArtifacts/ContactHorizontalItem_contact.graphql';

type ContactHorizontalItemProps = {
  contact: ContactHorizontalItem_contact$key;
  onShowContact: (contactId: string) => void;
  onShowContactAction: (contactId: string) => void;
};

const ContactHorizontalItem = ({
  contact: contactKey,
  onShowContact,
  onShowContactAction,
}: ContactHorizontalItemProps) => {
  const contact = useFragment(
    graphql`
      fragment ContactHorizontalItem_contact on Contact {
        id
        firstName
        lastName
        company
        phoneNumbers {
          number
          label
        }
        enrichmentStatus
        enrichment {
          approved
          fields {
            company
            phoneNumbers {
              number
              label
            }
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

  const onMore = useCallback(() => {
    onShowContactAction(contact.id);
  }, [contact, onShowContactAction]);

  const avatarSource = useImageFromContact(contact);

  return (
    <View style={styles.profile}>
      <PressableNative
        onPress={onShow}
        android_ripple={{ borderless: true, foreground: true }}
        onLongPress={onMore}
      >
        {!avatarSource && webCard ? (
          <CoverRenderer width={80} webCard={webCard} />
        ) : (
          <ContactAvatar
            firstName={firstName}
            lastName={lastName}
            name={name}
            company={contact.enrichment?.fields?.company || contact.company}
            avatar={avatarSource}
          />
        )}
        <EnrichmentOverlay
          overlayEnrichmentInProgress={
            contact.enrichmentStatus === 'running' ||
            contact.enrichmentStatus === 'pending'
          }
          overlayEnrichmentApprovementNeeded={
            contact.enrichmentStatus === 'completed' &&
            contact.enrichment?.approved === null
          }
          small={false}
          scale={1}
          name={name}
          company={contact.enrichment?.fields?.company || contact.company}
        />
      </PressableNative>
      <WhatsappButton
        phoneNumbers={
          [
            ...(contact.phoneNumbers || []),
            ...(contact?.enrichment?.fields?.phoneNumbers || []),
          ] as ContactPhoneNumberType[]
        }
        style={styles.invite}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  profile: {
    position: 'relative',
    marginBottom: 30,
    overflow: 'hidden',
  },
  invite: {
    position: 'absolute',
    top: 5,
    right: 5,
    borderColor: '#FFFFFF66',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 27,
    backgroundColor: '#0000004D',
    width: 31,
    height: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ContactHorizontalItem;
