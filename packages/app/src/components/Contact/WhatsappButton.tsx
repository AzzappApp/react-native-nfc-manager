import { Image } from 'expo-image';
import parsePhoneNumberFromString, {
  isValidPhoneNumber,
} from 'libphonenumber-js';
import { memo } from 'react';
import { Linking, StyleSheet } from 'react-native';
import useBoolean from '#hooks/useBoolean';
import ContactPhoneNumberPicker from '#screens/ContactsScreen/ContactPhoneNumberPicker';
import {
  getWhatsAppUrl,
  useIsWhatsAppSupportedContext,
} from '#screens/ContactsScreen/isWhatsappSupportedContext';
import PressableNative from '#ui/PressableNative';
import type { ContactPhoneNumberType } from '#helpers/contactTypes';
import type { PressableNativeProps } from '#ui/PressableNative';

const WhatsappButton = ({
  phoneNumbers,
  ...props
}: PressableNativeProps & {
  phoneNumbers?: ContactPhoneNumberType[] | null;
}) => {
  // check whatsapp is installed
  const isWhatsappSupported = useIsWhatsAppSupportedContext();
  const [pickerDisplayed, showPicker, hidePicker] = useBoolean(false);

  // filter out invalid phone numbers
  const validPhoneNumbers = phoneNumbers?.filter(
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

  // check contact has phone number
  if (
    !isWhatsappSupported ||
    !validPhoneNumbers ||
    validPhoneNumbers.length === 0
  ) {
    return undefined;
  }
  // get whatsapp deeplink
  const handleClick = () => {
    if (validPhoneNumbers.length > 1) {
      showPicker();
      return;
    } else if (validPhoneNumbers.length === 1) {
      const url = getWhatsAppUrl(validPhoneNumbers[0].number);
      Linking.openURL(url);
    }
  };

  return (
    <>
      <PressableNative onPress={handleClick} {...props}>
        <Image style={styles.image} source={require('#assets/whatsapp.svg')} />
      </PressableNative>
      {pickerDisplayed && (
        <ContactPhoneNumberPicker
          hidePicker={hidePicker}
          phoneNumbers={validPhoneNumbers}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  image: { width: 31, height: 31 },
});

export default memo(WhatsappButton);
