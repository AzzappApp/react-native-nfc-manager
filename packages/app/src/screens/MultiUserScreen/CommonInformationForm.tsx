import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import FormDeleteFieldOverlay from '#components/ContactCard/FormDeleteFieldOverlay';
import ScreenModal from '#components/ScreenModal';
import { buildContactCardModalStyleSheet } from '#helpers/contactCardHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import Separation from '#ui/Separation';
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
import type { CommonInformationForm_data$key } from '#relayArtifacts/CommonInformationForm_data.graphql';

export type CommonInformationFormProps = {
  commonInfoFormIsOpened: boolean;
  toggleCommonInfoForm: () => void;
  commonInformation: CommonInformationForm_data$key | null;
  webCardId: string;
};

const CommonInformationForm = ({
  commonInfoFormIsOpened,
  toggleCommonInfoForm,
  commonInformation,
  webCardId,
}: CommonInformationFormProps) => {
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

  const intl = useIntl();

  const styles = useStyleSheet(styleSheet);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<CommonInformationFormType>({
    mode: 'onBlur',
    resolver: zodResolver(commonInformationSchema),
    shouldFocusError: true,
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
            webCardId,
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

  const insets = useScreenInsets();

  return (
    <ScreenModal visible={commonInfoFormIsOpened}>
      <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
        <View
          style={{
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            flex: 1,
          }}
        >
          <Header
            middleElement={intl.formatMessage({
              defaultMessage: 'Common information',
              description: 'Common information form header title',
            })}
            leftElement={
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Cancel',
                  description: 'Edit common information cancel button title',
                })}
                onPress={() => {
                  reset({
                    ...commonInfo,
                    emails: commonInfo?.emails?.map(m => ({ ...m })) ?? [],
                    phoneNumbers:
                      commonInfo?.phoneNumbers?.map(p => ({ ...p })) ?? [],
                    urls: commonInfo?.urls?.map(p => ({ ...p })) ?? [],
                    addresses:
                      commonInfo?.addresses?.map(p => ({ ...p })) ?? [],
                    socials: commonInfo?.socials?.map(p => ({ ...p })) ?? [],
                  });
                  toggleCommonInfoForm();
                }}
                variant="secondary"
                style={styles.headerButton}
              />
            }
            rightElement={
              <Button
                testID="save-common-information"
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
          />
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
              <Separation />
              <CommonInformationAddresses control={control} />
              <Separation />
              <CommonInformationPhones control={control} />
              <Separation />
              <CommonInformationEmails control={control} />
              <Separation />
              <CommonInformationUrls control={control} />
              <Separation />
              <CommonInformationSocials control={control} />
            </View>
          </FormDeleteFieldOverlay>
        </View>
      </KeyboardAvoidingView>
    </ScreenModal>
  );
};

const styleSheet = createStyleSheet(appearance => ({
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
