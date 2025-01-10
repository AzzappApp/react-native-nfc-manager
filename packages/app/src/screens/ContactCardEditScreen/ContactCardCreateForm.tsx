import { ImageFormat } from '@shopify/react-native-skia';
import { useCallback, useState } from 'react';
import { Controller, useController, useWatch } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { AVATAR_MAX_WIDTH } from '@azzapp/shared/contactCardHelpers';
import FormDeleteFieldOverlay from '#components/ContactCard/FormDeleteFieldOverlay';
import ImagePicker, {
  EditImageStep,
  ImagePickerContactCardMediaWrapper,
  SelectImageStepWithFrontCameraByDefault,
} from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import { buildContactCardModalStyleSheet } from '#helpers/contactCardHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { saveTransformedImageToFile } from '#helpers/mediaEditions';
import Separation from '#ui/Separation';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import ContactCardEditModalAddresses from './ContactCardEditModalAddresses';
import ContactCardEditModalAvatar from './ContactCardEditModalAvatar';
import ContactCardEditModalBirthdays from './ContactCardEditModalBirthday';
import ContactCardEditModalEmails from './ContactCardEditModalEmails';
import ContactCardEditModalName from './ContactCardEditModalName';
import ContactCardEditModalPhones from './ContactCardEditModalPhones';
import ContactCardEditModalSocials from './ContactCardEditModalSocials';
import ContactCardEditModalUrls from './ContactCardEditModalUrls';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { ContactCardFormValues } from './ContactCardSchema';
import type { ReactNode } from 'react';
import type { Control } from 'react-hook-form';

type ContactCardCreateFormProps = {
  control: Control<ContactCardFormValues>;
  children?: ReactNode;
  footer?: ReactNode;
};

const ContactCardCreateForm = ({
  control,
  children,
  footer,
}: ContactCardCreateFormProps) => {
  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();
  const webCardKind = useWatch({
    control,
    name: 'webCardKind',
  });

  const { field: avatarField } = useController({
    control,
    name: 'avatar',
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

  return (
    <>
      <FormDeleteFieldOverlay>
        <View style={styles.sectionsContainer}>
          {children}
          <ContactCardEditModalAvatar
            control={control}
            onPickerRequested={onPickerRequested}
          />
          <Separation small />
          <ContactCardEditModalName
            control={control}
            isFirstnameMandatory={webCardKind === 'personal'}
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
                  {webCardKind === 'business' && <Text>*</Text>}
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
          <Controller
            control={control}
            name="webCardKind"
            render={({ field: { onChange, value } }) => (
              <View style={styles.field}>
                <Text variant="smallbold" style={styles.fieldTitle}>
                  <FormattedMessage
                    defaultMessage="This is a company ContactCard"
                    description="webcard kind field registered for the contact card"
                  />
                </Text>
                <Switch
                  variant="large"
                  value={value === 'business'}
                  onValueChange={() => {
                    const newValue =
                      value === 'business' ? 'personal' : 'business';
                    onChange(newValue);
                  }}
                />
              </View>
            )}
          />
          {webCardKind === 'business' ? (
            <>
              <Controller
                control={control}
                name="companyActivityLabel"
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <View style={styles.field}>
                    <Text variant="smallbold" style={styles.fieldTitle}>
                      <FormattedMessage
                        defaultMessage="Company's activity"
                        description="webcard company's activity field registered for the contact card"
                      />
                    </Text>
                    <TextInput
                      value={value ?? undefined}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      style={styles.input}
                      clearButtonMode="while-editing"
                      placeholder={intl.formatMessage({
                        defaultMessage: 'Enter a company activity',
                        description:
                          'Placeholder for company activity inside contact card',
                      })}
                      ref={ref}
                    />
                  </View>
                )}
              />
              <Controller
                control={control}
                name="companyUrl"
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <View style={styles.field}>
                    <Text variant="smallbold" style={styles.fieldTitle}>
                      <FormattedMessage
                        defaultMessage="Company's url"
                        description="webcard company's url field registered for the contact card"
                      />
                    </Text>
                    <TextInput
                      value={value ?? undefined}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      style={styles.input}
                      clearButtonMode="while-editing"
                      placeholder={intl.formatMessage({
                        defaultMessage: 'https://',
                        description:
                          'Placeholder for company url inside contact card',
                      })}
                      ref={ref}
                    />
                  </View>
                )}
              />
            </>
          ) : undefined}
          <Separation />
          <ContactCardEditModalPhones control={control} />
          <Separation />
          <ContactCardEditModalEmails control={control} />
          <Separation />
          <ContactCardEditModalUrls control={control} />
          <Separation />
          <ContactCardEditModalAddresses control={control} />
          <Separation />
          <ContactCardEditModalBirthdays control={control} />
          <Separation />
          <ContactCardEditModalSocials control={control} />
        </View>
        {footer}
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
  ...buildContactCardModalStyleSheet(appearance),
}));

export default ContactCardCreateForm;
