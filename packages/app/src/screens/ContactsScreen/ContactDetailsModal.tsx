import { useCallback, useImperativeHandle, useState, forwardRef } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { Gesture, type NativeGesture } from 'react-native-gesture-handler';
import useScreenInsets from '#hooks/useScreenInsets';
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

  const scrollListGesture = Gesture.Native();

  const nativeGestureItems: NativeGesture[] = [scrollListGesture];

  const { height } = useWindowDimensions();
  const { top, bottom } = useScreenInsets();

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
    <BottomSheetModal
      height={height - top - bottom - (Platform.OS === 'ios' ? 0 : 100)}
      visible={!!details}
      onRequestClose={onClose}
      contentContainerStyle={{ paddingHorizontal: 0 }}
      nativeGestureItems={nativeGestureItems}
    >
      {details && (
        <ContactDetailsBody
          scrollListGesture={scrollListGesture}
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
