import { ImageFormat } from '@shopify/react-native-skia';
import { useCallback, useState } from 'react';
import { Controller, useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { AVATAR_MAX_WIDTH } from '@azzapp/shared/contactCardHelpers';
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

type ContactCreateFormProps = {
  control: Control<ContactFormValues>;
};

const ContactCreateForm = ({ control }: ContactCreateFormProps) => {
  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();

  const { field: avatarField } = useController({
    control,
    name: 'avatar',
  });
  const { field: notifyField } = useController({
    control,
    name: 'notify',
  });

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

  return (
    <>
      <FormDeleteFieldOverlay>
        <View style={styles.sectionsContainer}>
          <View style={styles.field}>
            <CheckBox
              label={
                <Text style={{ paddingLeft: 10 }}>
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
}));

export default ContactCreateForm;
