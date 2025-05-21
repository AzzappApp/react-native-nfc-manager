import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { isDefined } from '@azzapp/shared/isDefined';
import { ENABLE_DATA_ENRICHMENT } from '#Config';
import { colors } from '#theme';
import { ContactActionModalOption } from '#components/Contact/ContactActionModal';
import BottomSheetModal from '#ui/BottomSheetModal';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ContactActionModalOptionProps } from '#components/Contact/ContactActionModal';
import type { ContactDetailActionModal_contact$key } from '#relayArtifacts/ContactDetailActionModal_contact.graphql';
import type { Icons } from '#ui/Icon';

type ContactDetailActionModalProps = {
  close: () => void;
  onRemoveContacts: () => void;
  visible?: boolean;
  onSaveContact: () => void;
  onShare: () => void;
  onEdit: () => void;
  onEnrich?: () => void;
  contact?: ContactDetailActionModal_contact$key | null;
};

const ContactDetailActionModal = ({
  contact: contactKey,
  visible,
  close,
  onRemoveContacts,
  onSaveContact,
  onShare,
  onEdit,
  onEnrich,
}: ContactDetailActionModalProps) => {
  const intl = useIntl();
  const contact = useFragment(
    graphql`
      fragment ContactDetailActionModal_contact on Contact {
        firstName
        lastName
      }
    `,
    contactKey,
  );
  const elements = useMemo<ContactActionModalOptionProps[]>(() => {
    return [
      {
        icon: 'edit' as Icons,
        text: intl.formatMessage({
          defaultMessage: 'Edit Contact details',
          description: 'ContactsScreen - More option alert - edit',
        }),
        onPress: onEdit,
      },
      ENABLE_DATA_ENRICHMENT && onEnrich
        ? {
            icon: 'filters' as Icons,
            text: intl.formatMessage({
              defaultMessage: 'Enrich with azzapp AI',
              description: 'ContactsScreen - More option alert - Enrich',
            }),
            onPress: onEnrich,
          }
        : undefined,
      {
        icon: 'share' as Icons,
        text: intl.formatMessage({
          defaultMessage: 'Share Contact',
          description: 'ContactsScreen - More option alert - share',
        }),
        onPress: onShare,
      },
      {
        icon: 'invite' as Icons,
        text: intl.formatMessage({
          defaultMessage: "Save to my phone's Contact",
          description: 'ContactsScreen - More option alert - save',
        }),
        onPress: onSaveContact,
      },
    ].filter(isDefined);
  }, [intl, onEdit, onEnrich, onShare, onSaveContact]);

  const confirmDelete = () => {
    Alert.alert(
      intl.formatMessage({
        defaultMessage: 'Delete this contact',
        description: 'Title of delete contact Alert',
      }),
      intl.formatMessage({
        defaultMessage:
          'Are you sure you want to delete this contact? This action is irreversible.',
        description: 'description of delete contact Alert',
      }),
      [
        {
          text: intl.formatMessage({
            defaultMessage: 'Delete this contact',
            description: 'button of delete contact Alert',
          }),
          onPress: onRemoveContacts,
          style: 'destructive',
        },
        {
          text: intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Cancel button of delete contact Alert',
          }),
          isPreferred: true,
        },
      ],
    );
  };

  return (
    <BottomSheetModal
      index={0}
      visible={!!visible}
      onDismiss={close}
      enablePanDownToClose
      stackBehavior="push"
    >
      <Text variant="small" style={styles.titleText}>
        {`${contact?.firstName ?? ''} ${contact?.lastName ?? ''}`.trim()}
      </Text>

      {elements.map((element, index) => {
        return <ContactActionModalOption key={index} {...element} />;
      })}
      <PressableNative style={styles.removeButton} onPress={confirmDelete}>
        <Text variant="button" style={styles.removeText}>
          <FormattedMessage
            defaultMessage="Remove contact"
            description="ContactsDetailScreen - remove contact"
          />
        </Text>
      </PressableNative>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  titleText: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    textAlign: 'center',
    color: colors.grey400,
  },
  removeButton: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  removeText: {
    color: colors.red400,
  },
});

export default ContactDetailActionModal;
