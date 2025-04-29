import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { colors } from '#theme';
import ContactActionModalOption from '#screens/ContactsScreen/ContactActionModalOption';
import BottomSheetModal from '#ui/BottomSheetModal';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ContactType } from '#helpers/contactTypes';
import type { ContactActionModalOptionProps } from '#screens/ContactsScreen/ContactActionModalOption';
import type { Icons } from '#ui/Icon';

type ContactDetailActionModalProps = {
  close: () => void;
  onRemoveContacts: () => void;
  visible?: boolean;
  onSaveContact: () => void;
  onShare: () => void;
  onEdit: () => void;
  details?: ContactType;
};

const ContactDetailActionModal = ({
  details,
  visible,
  close,
  onRemoveContacts,
  onSaveContact,
  onShare,
  onEdit,
}: ContactDetailActionModalProps) => {
  const intl = useIntl();

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
    ];
  }, [intl, onSaveContact, onShare, onEdit]);

  return (
    <BottomSheetModal
      index={0}
      visible={!!visible}
      onDismiss={close}
      enablePanDownToClose
      stackBehavior="push"
    >
      <Text variant="small" style={styles.titleText}>
        {`${details?.firstName ?? ''} ${details?.lastName ?? ''}`.trim()}
      </Text>

      {elements.map((element, index) => {
        return <ContactActionModalOption key={index} {...element} />;
      })}
      <PressableNative style={styles.removeButton} onPress={onRemoveContacts}>
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
