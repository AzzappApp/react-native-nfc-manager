import { Image } from 'expo-image';
import parsePhoneNumberFromString, {
  isValidPhoneNumber,
} from 'libphonenumber-js';
import { memo } from 'react';
import { Linking, StyleSheet } from 'react-native';
import {
  getWhatsAppUrl,
  useIsWhatsAppSupportedContext,
} from '#screens/ContactsScreen/isWhatsappSupportedContext';
import PressableNative from '#ui/PressableNative';
import type { ContactPhoneNumberType } from '#helpers/contactTypes';
import type { PressableNativeProps } from '#ui/PressableNative';

const WhatsappButton = ({
  phoneNumber: contactPhoneNumber,
  ...props
}: PressableNativeProps & {
  phoneNumber?: ContactPhoneNumberType[] | null;
}) => {
  // check whatsapp is installed
  const isWhatsappSupported = useIsWhatsAppSupportedContext();

  // check contact has phone number
  if (
    !isWhatsappSupported ||
    !contactPhoneNumber ||
    contactPhoneNumber.length === 0
  ) {
    return undefined;
  }
  // check contact has valid phone number
  const phoneNumber = contactPhoneNumber.find(
    (number: ContactPhoneNumberType) => {
      const parsedNumber = parsePhoneNumberFromString(number.number);
      if (!parsedNumber) {
        return false;
      }
      if (!isValidPhoneNumber(number.number)) {
        return false;
      }
      return true;
    },
  );
  if (!phoneNumber) return undefined;

  // get whatsapp deeplink
  const handleClick = () => {
    const url = getWhatsAppUrl(phoneNumber.number);
    Linking.openURL(url);
  };

  return (
    <PressableNative onPress={handleClick} {...props}>
      <Image style={styles.image} source={require('#assets/whatsapp.svg')} />
    </PressableNative>
  );
};

const styles = StyleSheet.create({
  image: { width: 31, height: 31 },
});

export default memo(WhatsappButton);
