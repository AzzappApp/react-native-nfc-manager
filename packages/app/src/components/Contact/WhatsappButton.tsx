import { Image } from 'expo-image';
import parsePhoneNumberFromString from 'libphonenumber-js';
import { memo } from 'react';
import { Linking, StyleSheet } from 'react-native';
import {
  getWhatsAppUrl,
  useIsWhatsAppSupportedContext,
} from '#screens/ContactsScreen/isWhatsappSupportedContext';
import PressableNative from '#ui/PressableNative';
import type { PressableNativeProps } from '#ui/PressableNative';

const WhatsappButton = ({
  phoneNumber: contactPhoneNumber,
  ...props
}: PressableNativeProps & { phoneNumber: string }) => {
  const isWhatsappSupported = useIsWhatsAppSupportedContext();
  if (!isWhatsappSupported || !contactPhoneNumber) return undefined;

  const phoneNumber = parsePhoneNumberFromString(contactPhoneNumber);
  if (!phoneNumber) {
    return undefined;
  }
  const url = getWhatsAppUrl(phoneNumber.number);
  if (!url) {
    return undefined;
  }

  const handleClick = () => {
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
