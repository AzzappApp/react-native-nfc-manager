import { ImageFormat } from '@shopify/react-native-skia';
import { useCallback, useState } from 'react';
import { Controller, useController, useWatch } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import * as mime from 'react-native-mime-types';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import { AVATAR_MAX_WIDTH } from '@azzapp/shared/contactCardHelpers';
import { colors } from '#theme';
import FormDeleteFieldOverlay from '#components/FormDeleteFieldOverlay';
import ImagePicker, {
  EditImageStep,
  ImagePickerContactCardMediaWrapper,
  SelectImageStepWithFrontCameraByDefault,
} from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { buildContactStyleSheet } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { saveTransformedImageToFile } from '#helpers/mediaEditions';
import Separation from '#ui/Separation';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import ContactCardEditModalAddresses from './ContactCardEditAddresses';
import ContactCardEditModalAvatar from './ContactCardEditAvatar';
import ContactCardEditModalBirthdays from './ContactCardEditBirthday';
import ContactCardEditCompanyColor from './ContactCardEditCompanyColor';
import ContactCardEditCompanyLogo from './ContactCardEditCompanyLogo';
import ContactCardEditModalEmails from './ContactCardEditEmails';
import ContactCardEditModalName from './ContactCardEditName';
import ContactCardEditModalPhones from './ContactCardEditPhones';
import ContactCardEditModalSocials from './ContactCardEditSocials';
import ContactCardEditModalUrls from './ContactCardEditUrls';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { ContactCardCreateForm_user$key } from '#relayArtifacts/ContactCardCreateForm_user.graphql';
import type { ContactCardFormValues } from './ContactCardSchema';
import type { ReactNode } from 'react';
import type { Control } from 'react-hook-form';

type ContactCardCreateFormProps = {
  control: Control<ContactCardFormValues>;
  children?: ReactNode;
  footer?: ReactNode;
  user: ContactCardCreateForm_user$key | null;
};

const ContactCardCreateForm = ({
  control,
  children,
  footer,
  user: userKey,
}: ContactCardCreateFormProps) => {
  const user = useFragment(
    graphql`
      fragment ContactCardCreateForm_user on User {
        id
        isPremium
      }
    `,
    userKey,
  );

  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();
  const webCardKind = useWatch({
    control,
    name: 'webCardKind',
  });

  const businessCardOverlayStyle = useAnimatedStyle(() => {
    return {
      pointerEvents: webCardKind === 'business' ? 'auto' : 'none',
      opacity: withTiming(webCardKind === 'business' ? 1 : 0.2, {
        duration: 300,
      }),
    };
  });

  const { field: avatarField } = useController({
    control,
    name: 'avatar',
  });

  const { field: logoField } = useController({
    control,
    name: 'logo',
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
        const mimeType =
          mime.lookup(uri) === 'image/png' ? ImageFormat.PNG : ImageFormat.JPEG;
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
            isFirstNameMandatory={webCardKind === 'personal'}
          />
          <Separation />
          <Controller
            control={control}
            name="webCardKind"
            render={({ field: { onChange, value } }) => (
              <View style={styles.field}>
                <View style={styles.fieldTitleWithPremiumContainer}>
                  <View style={styles.fieldTitleWithPremium}>
                    <Text variant="smallbold" style={styles.fieldTitle}>
                      <FormattedMessage
                        defaultMessage="This is a company ContactCard"
                        description="webcard kind field registered for the contact card"
                      />
                    </Text>
                    <PremiumIndicator isRequired={!user?.isPremium} />
                  </View>
                  <Text variant="smallbold" style={styles.premiumSubtitle}>
                    <FormattedMessage
                      defaultMessage="7-Days free trial - Cancel anytime"
                      description="Contact card create screen - business card subscription conditions"
                    />
                  </Text>
                </View>
                <Switch
                  variant="large"
                  value={value === 'business'}
                  onValueChange={() => {
                    Toast.hide();
                    const newValue =
                      value === 'business' ? 'personal' : 'business';
                    onChange(newValue);
                  }}
                />
              </View>
            )}
          />
          <Separation small />
          <Animated.View style={businessCardOverlayStyle}>
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
                    <Text>*</Text>
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
            <ContactCardEditCompanyLogo
              control={control}
              isPremium
              isUserContactCard
            />
            <Separation small />
            {logoField.value && (
              <>
                <ContactCardEditCompanyColor control={control} />
                <Separation small />
              </>
            )}
            <Separation small />
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
            <Separation small />
            <ContactCardEditModalUrls
              control={control}
              isPremium //we consider that user will be premium when this field is accessible
            />
          </Animated.View>

          <Separation />
          <ContactCardEditModalPhones control={control} />
          <Separation />
          <ContactCardEditModalEmails control={control} />
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
  fieldTitleWithPremiumContainer: { rowGap: 15 },
  fieldTitleWithPremium: { flexDirection: 'row' },
  premiumSubtitle: { color: colors.grey500 },
  ...buildContactStyleSheet(appearance),
}));

export default ContactCardCreateForm;
