import { Image } from 'expo-image';
import parsePhoneNumberFromString, {
  isValidPhoneNumber,
} from 'libphonenumber-js';
import { Suspense, use } from 'react';
import { Linking, StyleSheet } from 'react-native';
import ContactPhoneNumberPicker from '#components/Contact/ContactPhoneNumberPicker';
import { getWhatsAppUrl, isWhatsAppSupported } from '#helpers/whatsAppHelpers';
import useBoolean from '#hooks/useBoolean';
import PressableNative from '#ui/PressableNative';
import type { ContactPhoneNumberType } from '#helpers/contactHelpers';
import type { PressableNativeProps } from '#ui/PressableNative';

type WhatsappButtonProps = PressableNativeProps & {
  phoneNumbers?: ContactPhoneNumberType[] | null;
};

const WhatsappButton = (props: WhatsappButtonProps) => {
  return (
    <Suspense>
      <WhatsappButtonInner {...props} />
    </Suspense>
  );
};

export default WhatsappButton;

const WhatsappButtonInner = ({
  phoneNumbers,
  ...props
}: WhatsappButtonProps) => {
  // check whatsapp is installed
  const [pickerDisplayed, showPicker, hidePicker] = useBoolean(false);

  const whatsAppSupported = use(isWhatsAppSupported());

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
    !whatsAppSupported ||
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
      <PressableNative
        onPress={handleClick}
        android_ripple={{
          borderless: true,
          foreground: true,
        }}
        hitSlop={5}
        {...props}
      >
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
