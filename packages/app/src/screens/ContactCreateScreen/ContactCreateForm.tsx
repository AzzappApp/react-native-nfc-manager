import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Image, View } from 'react-native';
import { colors, shadow } from '#theme';
import ContactForm from '#components/Contact/ContactForm';
import FormDeleteFieldOverlay from '#components/FormDeleteFieldOverlay';
import { buildContactStyleSheet } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenDimensions from '#hooks/useScreenDimensions';
import CheckBox from '#ui/CheckBox';
import Text from '#ui/Text';
import type { contactFormValues } from '#helpers/contactHelpers';
import type { Control } from 'react-hook-form';
import type { ScrollView } from 'react-native';

type ContactCreateFormProps = {
  control: Control<contactFormValues>;
  //not added in the formValue for the simple reason it is not save in the form, just informative data
  scanImage: {
    uri: string;
    aspectRatio: number;
  } | null;
  notifyError: boolean;
  notify: boolean;
  toggleNotify: () => void;
};

const ContactCreateForm = ({
  control,
  scanImage,
  notifyError,
  notify,
  toggleNotify,
}: ContactCreateFormProps) => {
  const styles = useStyleSheet(styleSheet);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (notifyError) {
      scrollRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    }
  }, [notifyError]);

  const { width } = useScreenDimensions();
  return (
    <>
      <FormDeleteFieldOverlay ref={scrollRef}>
        <View style={styles.sectionsContainer}>
          {scanImage && (
            <View style={styles.imageContainer}>
              <View
                style={[
                  styles.imageViewScan,
                  { width: scanImage.aspectRatio > 1 ? width - 40 : width / 2 },
                ]}
              >
                <Image
                  source={{ uri: scanImage.uri }}
                  style={{
                    aspectRatio: scanImage.aspectRatio,
                  }}
                />
              </View>
            </View>
          )}
          <View style={[styles.shareback, notifyError && styles.notifyError]}>
            <CheckBox
              label={
                <Text style={styles.textCheckbox}>
                  <FormattedMessage
                    defaultMessage="Send your azzapp card to this contact"
                    description="Send checkbox label in add contact form"
                  />
                </Text>
              }
              status={notify ? 'checked' : 'none'}
              onValueChange={toggleNotify}
            />
          </View>
          <ContactForm control={control} />
        </View>
      </FormDeleteFieldOverlay>
    </>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  fieldTitleWithLock: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  confirmModalButton: { width: 255 },
  ...buildContactStyleSheet(appearance),
  imageContainer: {
    alignItems: 'center',
    marginTop: 20,
    ...shadow({ appearance }),
    overflow: 'visible',
    marginBottom: 20,
  },
  imageViewScan: {
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.white,
    width: '100%',
    marginHorizontal: 20,
  },
  shareback: {
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 15,
    minHeight: 58,
    marginTop: 10,
  },
  textCheckbox: { paddingLeft: 10 },
  notifyError: {
    backgroundColor: colors.warnLight,
  },
}));

export default ContactCreateForm;
