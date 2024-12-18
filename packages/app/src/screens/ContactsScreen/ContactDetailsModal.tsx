import { useCallback, useImperativeHandle, useState, forwardRef } from 'react';
import ContactDetailsBody from '#screens/ContactDetailsScreen/ContactDetailsBody';
import BottomSheetModal from '#ui/BottomSheetModal';
import type { Contact } from 'expo-contacts';
import type { ForwardedRef } from 'react';

export type ContactDetailsModalActions = {
  open: (details: ContactDetails) => void;
};

type Props = {
  onInviteContact: (details: ContactDetails) => void;
};

const ContactDetailsModal = (
  { onInviteContact }: Props,
  ref: ForwardedRef<ContactDetailsModalActions>,
) => {
  const [details, setDetails] = useState<ContactDetails | null>(null);

  const onClose = useCallback(() => {
    setDetails(null);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      open: setDetails,
    }),
    [],
  );

  const onSave = useCallback(() => {
    if (details) onInviteContact(details);
  }, [details, onInviteContact]);

  return (
    <BottomSheetModal visible={!!details} onDismiss={onClose}>
      {details && (
        <ContactDetailsBody
          details={details}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </BottomSheetModal>
  );
};

export type ContactDetails = Contact & {
  createdAt: Date;
  profileId?: string;
};

export default forwardRef(ContactDetailsModal);
