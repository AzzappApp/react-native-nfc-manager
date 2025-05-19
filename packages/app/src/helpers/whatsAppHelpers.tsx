import { Linking } from 'react-native';

/*
 * build a deeplink to whatsapp from a phone number
 */
export const getWhatsAppUrl = (number: string) => {
  return `whatsapp://send?phone=${number}`;
};

let _isWhatsAppSupportedPromise: Promise<boolean> | undefined = undefined;
export const isWhatsAppSupported = () => {
  if (_isWhatsAppSupportedPromise === undefined) {
    _isWhatsAppSupportedPromise = Linking.canOpenURL(getWhatsAppUrl('0'));
  }
  return _isWhatsAppSupportedPromise;
};
