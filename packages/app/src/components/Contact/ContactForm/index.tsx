import { ImageFormat } from '@shopify/react-native-skia';
import { useCallback, useState } from 'react';
import { Controller, useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import * as mime from 'react-native-mime-types';
import { AVATAR_MAX_WIDTH } from '@azzapp/shared/contactCardHelpers';
import ImagePicker, {
  EditImageStep,
  ImagePickerContactCardMediaWrapper,
  SelectImageStepWithFrontCameraByDefault,
} from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import { buildContactStyleSheet } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { saveTransformedImageToFile } from '#helpers/mediaEditions';
import ContactCardEditCompanyLogo from '#screens/ContactCardEditScreen/ContactCardEditCompanyLogo';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import ContactEditAddresses from './ContactEditAddresses';
import ContactEditAvatar from './ContactEditAvatar';
import ContactEditBirthday from './ContactEditBirthday';
import ContactEditEmails from './ContactEditEmails';
import ContactEditMeetingDate from './ContactEditMeetingDate';
import ContactEditName from './ContactEditName';
import ContactEditPhones from './ContactEditPhones';
import ContactEditSocials from './ContactEditSocials';
import ContactEditUrls from './ContactEditUrls';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { contactFormValues } from '#helpers/contactHelpers';
import type { Control } from 'react-hook-form';

type ContactFormProps = {
  control: Control<contactFormValues>;
};

const ContactForm = ({ control }: ContactFormProps) => {
  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();
  const [imagePicker, setImagePicker] = useState<'avatar' | null>(null);
  const onPickerRequested = () => setImagePicker('avatar');

  const { field: avatarField } = useController({
    control,
    name: 'avatar',
  });

  const onCancel = () => {
    setImagePicker(null);
  };

  const onImagePickerFinished = useCallback(
    async ({
      uri,
      width,
      editionParameters,
      filter,
      aspectRatio,
    }: ImagePickerResult) => {
      if (imagePicker === 'avatar') {
        const mimeType =
          mime.lookup(uri) === 'image/png' ? ImageFormat.PNG : ImageFormat.JPEG;

        const exportWidth = Math.min(AVATAR_MAX_WIDTH, width);
        const exportHeight = exportWidth / aspectRatio;
        const localPath = await saveTransformedImageToFile({
          uri,
          resolution: { width: exportWidth, height: exportHeight },
          format: mimeType,
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

  return (
    <>
      <ContactEditAvatar
        control={control}
        onPickerRequested={onPickerRequested}
      />
      <Separation small />
      <ContactEditName control={control} />
      <ContactEditMeetingDate control={control} />
      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <View style={styles.field}>
            <Text variant="smallbold" style={styles.fieldTitle}>
              <FormattedMessage
                defaultMessage="Note"
                description="Note field registered for the contact card"
              />
            </Text>
            <TextInput
              multiline
              value={value ?? undefined}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
              clearButtonMode="while-editing"
              placeholder={intl.formatMessage({
                defaultMessage: 'Enter a contact note',
                description: 'Placeholder for note inside contact card',
              })}
              ref={ref}
            />
          </View>
        )}
      />
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
                description: 'Placeholder for company name inside contact card',
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
  ...buildContactStyleSheet(appearance),
}));

export default ContactForm;
