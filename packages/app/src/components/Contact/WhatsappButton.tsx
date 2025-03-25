import * as Sentry from '@sentry/react-native';
import { Image } from 'expo-image';
import parsePhoneNumberFromString from 'libphonenumber-js';
import { memo, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import PressableNative from '#ui/PressableNative';
import type { PressableNativeProps } from '#ui/PressableNative';

const WhatsappButton = ({
  phoneNumber: contactPhoneNumber,
  ...props
}: PressableNativeProps & { phoneNumber: string }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    let phoneNumber;
    if (contactPhoneNumber) {
      phoneNumber = parsePhoneNumberFromString(contactPhoneNumber);
    }
    if (phoneNumber) {
      getUrl(phoneNumber.number)
        .then(setUrl)
        .catch(err => {
          Sentry.captureException(err);
        });
    }
  }, [contactPhoneNumber]);

  const handleClick = () => {
    Linking.openURL(url);
  };

  if (!url) {
    return null;
  }

  return (
    <PressableNative onPress={handleClick} {...props}>
      <Image
        style={{ width: 31, height: 31 }}
        source={require('#assets/whatsapp.svg')}
      />
    </PressableNative>
  );
};

export default memo(WhatsappButton);

const getUrl = async (number: string) => {
  const url = `whatsapp://send?phone=${number}`;
  const supported = await Linking.canOpenURL(url);

  if (!supported) {
    console.warn(`${url} is not supported`);
  }

  return supported ? url : '';
};
