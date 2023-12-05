import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import FormDeleteFieldOverlay from '#components/ContactCard/FormDeleteFieldOverlay';
import { buildContactCardModalStyleSheet } from '#helpers/contactCardHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import CommonInformationAddresses from './CommonInformationAddresses';
import CommonInformationEmails from './CommonInformationEmails';
import CommonInformationPhones from './CommonInformationPhones';
import {
  commonInformationSchema,
  type CommonInformationForm as CommonInformationFormType,
} from './CommonInformationSchema';
import CommonInformationSocials from './CommonInformationSocials';
import CommonInformationUrls from './CommonInformationUrls';
import type { CommonInformationForm_data$key } from '@azzapp/relay/artifacts/CommonInformationForm_data.graphql';

const CommonInformationForm = ({
  commonInfoFormIsOpened,
  toggleCommonInfoForm,
  commonInformation,
}: {
  commonInfoFormIsOpened: boolean;
  toggleCommonInfoForm: () => void;
  commonInformation: CommonInformationForm_data$key | null;
}) => {
  const commonInfo = useFragment(
    graphql`
      fragment CommonInformationForm_data on CommonInformation {
        company
        emails {
          label
          address
        }
        phoneNumbers {
          label
          number
        }
        urls {
          address
        }
        addresses {
          address
          label
        }
        socials {
          url
          label
        }
      }
    `,
    commonInformation,
  );

  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const intl = useIntl();

  const styles = useStyleSheet(styleSheet);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CommonInformationFormType>({
    mode: 'onBlur',
    resolver: zodResolver(commonInformationSchema),
    defaultValues: {
      ...commonInfo,
      emails: commonInfo?.emails?.map(m => ({ ...m })) ?? [],
      phoneNumbers: commonInfo?.phoneNumbers?.map(p => ({ ...p })) ?? [],
      urls: commonInfo?.urls?.map(p => ({ ...p })) ?? [],
      addresses: commonInfo?.addresses?.map(p => ({ ...p })) ?? [],
      socials: commonInfo?.socials?.map(p => ({ ...p })) ?? [],
    },
  });

  const [commit] = useMutation(graphql`
    mutation CommonInformationFormMutation(
      $input: SaveCommonInformationInput!
    ) {
      saveCommonInformation(input: $input) {
        webCard {
          commonInformation {
            ...CommonInformationForm_data
          }
        }
      }
    }
  `);

  const submit = handleSubmit(
    data => {
      commit({
        variables: {
          input: {
            ...data,
            emails: data.emails.filter(email => email.address),
            phoneNumbers: data.phoneNumbers.filter(
              phoneNumber => phoneNumber.number,
            ),
            urls: data.urls.filter(url => url.address),
            addresses: data.addresses.filter(address => address.address),
            socials: data.socials.filter(social => social.url),
          },
        },
        onCompleted: () => {
          toggleCommonInfoForm();
        },
        onError: e => {
          console.error(e);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage:
                'Error, could not save the common information. Please try again.',
              description:
                'Error toast message when saving common information failed',
            }),
          });
        },
      });
    },
    error => {
      console.log(error);
    },
  );

  return (
    <BottomSheetModal
      height={height - 30 - insets.top}
      visible={commonInfoFormIsOpened}
      contentContainerStyle={styles.bottomSheetContainerStyle}
      headerStyle={styles.headerStyle}
      onRequestClose={toggleCommonInfoForm}
      nestedScroll
      headerTitle={intl.formatMessage({
        defaultMessage: 'Common information',
        description: 'Common information form header title',
      })}
      showGestureIndicator
      disableKeyboardAvoidingView
      headerLeftButton={
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Edit common information cancel button title',
          })}
          onPress={toggleCommonInfoForm}
          variant="secondary"
          style={styles.headerButton}
        />
      }
      headerRightButton={
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Save',
            description: 'Edit common information save button label',
          })}
          loading={isSubmitting}
          onPress={submit}
          variant="primary"
          style={styles.headerButton}
        />
      }
    >
      <FormDeleteFieldOverlay>
        <View style={styles.sectionsContainer}>
          <View style={styles.container}>
            <Icon icon="lock_line" style={styles.icon} />
            <Text variant="xsmall" style={styles.description}>
              <FormattedMessage
                defaultMessage="Common information will be displayed on each team member’s Contact Card and won’t be editable."
                description="Common information form description"
              />
            </Text>
          </View>

          <Controller
            control={control}
            name="company"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text variant="smallbold" style={styles.fieldName}>
                  <FormattedMessage
                    defaultMessage="Company"
                    description="Company name field registered for the contact card"
                  />
                </Text>
                <TextInput
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  clearButtonMode="while-editing"
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Enter a company name',
                    description:
                      'Placeholder for company name inside contact card',
                  })}
                />
              </View>
            )}
          />
          <View style={styles.separator} />
          <CommonInformationAddresses control={control} />
          <View style={styles.separator} />
          <CommonInformationPhones control={control} />
          <View style={styles.separator} />
          <CommonInformationEmails control={control} />
          <View style={styles.separator} />
          <CommonInformationUrls control={control} />
          <View style={styles.separator} />
          <CommonInformationSocials control={control} />
        </View>
      </FormDeleteFieldOverlay>
    </BottomSheetModal>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  bottomSheetContainerStyle: { paddingHorizontal: 0 },
  headerStyle: { paddingHorizontal: 10 },
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  icon: { width: 60, height: 60 },
  container: {
    rowGap: 10,
    alignItems: 'center',
    backgroundColor: appearance === 'dark' ? '#000' : '#fff',
    paddingBottom: 20,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fieldName: { minWidth: 100 },
  ...buildContactCardModalStyleSheet(appearance),
}));

export default CommonInformationForm;
