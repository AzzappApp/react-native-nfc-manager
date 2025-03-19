import { ImageFormat } from '@shopify/react-native-skia';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, View } from 'react-native';
import { AVATAR_MAX_WIDTH } from '@azzapp/shared/contactCardHelpers';
import { colors, shadow } from '#theme';
import FormDeleteFieldOverlay from '#components/FormDeleteFieldOverlay';
import ImagePicker, {
  EditImageStep,
  ImagePickerContactCardMediaWrapper,
  SelectImageStepWithFrontCameraByDefault,
} from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import { buildContactStyleSheet } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { saveTransformedImageToFile } from '#helpers/mediaEditions';
import useScreenDimensions from '#hooks/useScreenDimensions';
import ContactCardEditCompanyLogo from '#screens/ContactCardEditScreen/ContactCardEditCompanyLogo';
import CheckBox from '#ui/CheckBox';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import ContactEditAddresses from './ContactEditAddresses';
import ContactEditAvatar from './ContactEditAvatar';
import ContactEditBirthday from './ContactEditBirthday';
import ContactEditEmails from './ContactEditEmails';
import ContactEditName from './ContactEditName';
import ContactEditPhones from './ContactEditPhones';
import ContactEditSocials from './ContactEditSocials';
import ContactEditUrls from './ContactEditUrls';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { CheckboxStatus } from '#ui/CheckBox';
import type { ContactFormValues } from './ContactSchema';
import type { Control } from 'react-hook-form';
import type { ScrollView } from 'react-native';

type ContactCreateFormProps = {
  control: Control<ContactFormValues>;
  //not added in the formValue for the simple reason it is not save in the form, just informative data
  scanImage: {
    uri: string;
    aspectRatio: number;
  } | null;
  notifyError: boolean;
};

const ContactCreateForm = ({
  control,
  scanImage,
  notifyError,
}: ContactCreateFormProps) => {
  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();
  const scrollRef = useRef<ScrollView>(null);

  const { field: avatarField } = useController({
    control,
    name: 'avatar',
  });
  const { field: notifyField } = useController({
    control,
    name: 'notify',
  });

  useEffect(() => {
    if (notifyError)
      scrollRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
  }, [notifyError]);

  const [imagePicker, setImagePicker] = useState<'avatar' | null>(null);

  const onImagePickerFinished = useCallback(
    async ({
      uri,
      width,
      editionParameters,
      filter,
      aspectRatio,
    }: ImagePickerResult) => {
      if (imagePicker === 'avatar') {
        const exportWidth = Math.min(AVATAR_MAX_WIDTH, width);
        const exportHeight = exportWidth / aspectRatio;
        const localPath = await saveTransformedImageToFile({
          uri,
          resolution: { width: exportWidth, height: exportHeight },
          format: ImageFormat.JPEG,
          quality: 95,
          filter,
          editionParameters,
        });
        avatarField.onChange({
          local: true,
          id: localPath,
          uri: localPath,
        });
      }
      setImagePicker(null);
    },
    [avatarField, imagePicker],
  );

  const onCancel = () => {
    setImagePicker(null);
  };

  const onPickerRequested = () => setImagePicker('avatar');

  const handleSendChange = useCallback(
    (value: CheckboxStatus) => {
      if (value === 'checked') {
        notifyField.onChange(true);
      } else {
        notifyField.onChange(false);
      }
    },
    [notifyField],
  );
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
              status={notifyField.value ? 'checked' : 'none'}
              onValueChange={handleSendChange}
            />
          </View>
          <ContactEditAvatar
            control={control}
            onPickerRequested={onPickerRequested}
          />
          <Separation small />
          <ContactEditName control={control} />
          <Separation />
          <Controller
            control={control}
            name="company"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <View style={styles.field}>
                <Text variant="smallbold" style={styles.fieldTitle}>
                  <FormattedMessage
                    defaultMessage="Company"
                    description="Company name field registered for the contact card"
                  />
                </Text>
                <TextInput
                  value={value ?? undefined}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  clearButtonMode="while-editing"
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Enter a company name',
                    description:
                      'Placeholder for company name inside contact card',
                  })}
                  ref={ref}
                />
              </View>
            )}
          />

          <Separation small />
          <ContactCardEditCompanyLogo control={control} isPremium />
          <Separation />
          <ContactEditPhones control={control} />
          <Separation />
          <ContactEditEmails control={control} />
          <Separation />
          <ContactEditUrls control={control} />
          <Separation />
          <ContactEditAddresses control={control} />
          <Separation />
          <ContactEditBirthday control={control} />
          <Separation />
          <ContactEditSocials control={control} />
        </View>
      </FormDeleteFieldOverlay>

      <ScreenModal
        visible={imagePicker !== null}
        animationType="slide"
        onRequestDismiss={() => setImagePicker(null)}
      >
        <ImagePicker
          kind="image"
          forceAspectRatio={1}
          TopPanelWrapper={ImagePickerContactCardMediaWrapper}
          steps={[SelectImageStepWithFrontCameraByDefault, EditImageStep]}
          onFinished={onImagePickerFinished}
          onCancel={onCancel}
          cameraButtonsLeftRightPosition={70}
        />
      </ScreenModal>
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
