import { Image } from 'expo-image';
import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { BackHandler, Linking, StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import { useContactPhoneLabels } from '#helpers/contactHelpers';
import BottomSheetModal from '#ui/BottomSheetModal';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import { getWhatsAppUrl } from './isWhatsappSupportedContext';
import type { ContactPhoneNumberType } from '#helpers/contactTypes';

type ContactPhoneNumberPickerProps = {
  phoneNumbers: ContactPhoneNumberType[];
  hidePicker: () => void;
};

/**
 * This component is used to display a list of phone numbers for a contact
 * and allow the user to select one to contact on WhatsApp with a context.
 */
const ContactPhoneNumberPicker = ({
  phoneNumbers,
  hidePicker,
}: ContactPhoneNumberPickerProps) => {
  // open whatsapp deeplink
  const handleClick = (phoneNumber: ContactPhoneNumberType) => {
    const url = getWhatsAppUrl(phoneNumber.number);
    Linking.openURL(url);
    hidePicker();
  };

  // Allow to close the modal with back button
  useEffect(() => {
    const onBackPress = () => {
      if (phoneNumbers) {
        hidePicker();
        return true;
      } else {
        return false;
      }
    };
    const unregister = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );
    return unregister.remove;
  }, [hidePicker, phoneNumbers]);

  const labelValues = useContactPhoneLabels();

  return (
    <BottomSheetModal visible onDismiss={hidePicker} enableDismissOnClose>
      <View style={styles.container}>
        <Text variant="button" style={styles.contactPhoneNumberPickerTitle}>
          <FormattedMessage
            description="ContactsScreen - Contact phone number picker title"
            defaultMessage="Select a number to contact on WhatsApp"
          />
        </Text>
        {phoneNumbers?.map((phoneNumber, index) => (
          <PressableNative
            key={`${phoneNumber.number}-${index}`}
            onPress={() => handleClick(phoneNumber)}
            style={styles.contactPhoneNumberPickerPressable}
          >
            <Text variant="medium">
              {labelValues?.find(label => label.key === phoneNumber.label)
                ?.value || phoneNumber.label}
            </Text>
            <View style={styles.rightContainer}>
              <Text variant="medium">{phoneNumber.number}</Text>
              <Image
                style={styles.image}
                source={require('#assets/whatsapp.svg')}
              />
            </View>
          </PressableNative>
        ))}
      </View>
    </BottomSheetModal>
  );
};

export default ContactPhoneNumberPicker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
    gap: 20,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 10,
  },
  contactPhoneNumberPickerTitle: {
    textAlign: 'center',
    color: colors.grey400,
    gap: 10,
  },
  contactPhoneNumberPickerPressable: {
    flex: 1,
    flexDirection: 'row',
    height: 32,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  image: { width: 31, height: 31 },
});
