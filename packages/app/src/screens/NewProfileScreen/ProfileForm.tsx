import { useCallback, useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchQuery,
  graphql,
  useFragment,
  useRelayEnvironment,
} from 'react-relay';
import { useDebounce } from 'use-debounce';
import * as z from 'zod';
import ERRORS from '@azzapp/shared/errors';
import {
  isNotFalsyString,
  isValidUserName,
} from '@azzapp/shared/stringHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import { createProfile } from '#helpers/MobileWebAPI';
import Form, { Submit } from '#ui/Form/Form';
import Icon from '#ui/Icon';
import Label from '#ui/Label';
import Select from '#ui/Select';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import ContinueButton from './ContinueButton';
import NewProfileScreenPageHeader from './NewProfileScreenPageHeader';
import type {
  ProfileForm_profileCategory$data,
  ProfileForm_profileCategory$key,
} from '@azzapp/relay/artifacts/ProfileForm_profileCategory.graphql';
import type { ProfileFormQuery } from '@azzapp/relay/artifacts/ProfileFormQuery.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { CreateProfileParams } from '@azzapp/shared/WebAPI';
import type { TextInput as RNTextInput } from 'react-native';

type ProfileFormProps = {
  profileKind: string;
  profileCategory: ProfileForm_profileCategory$key;
  onBack: () => void;
  onProfileCreated: (tokenResponse: {
    token: string;
    refreshToken: string;
    profileId: string;
    profileData: Omit<CreateProfileParams, 'authMethod'>;
  }) => void;
};

const profileFormSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  companyName: z.string(),
  companyActivityId: z.string(),
  userName: z.string().refine(userName => isValidUserName(userName), {
    message: 'Username can’t contain space or special caracters',
  }),
});

type ProfileForm = z.infer<typeof profileFormSchema>;

const ProfileForm = ({
  profileKind,
  profileCategory,
  onProfileCreated,
  onBack,
}: ProfileFormProps) => {
  const { id: profileCategoryId, companyActivities } = useFragment(
    graphql`
      fragment ProfileForm_profileCategory on ProfileCategory {
        id
        companyActivities {
          id
          label
        }
      }
    `,
    profileCategory,
  );

  const intl = useIntl();

  const userNameAlreadyExistsError = intl.formatMessage({
    defaultMessage: 'This username is already used by someone else',
    description: 'NewProfileScreen - Username already taken error',
  });

  const userNameInvalidError = intl.formatMessage({
    defaultMessage: 'Username can’t contain space or special characters',
    description: 'NewProfileScreen - Username Error',
  });

  const environment = useRelayEnvironment();

  const {
    control,
    trigger,
    handleSubmit,
    setError,
    watch,
    formState: { isSubmitting },
  } = useForm<ProfileForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      companyActivityId: '',
      userName: '',
    },
    mode: 'onSubmit',
    resolver: async data => {
      const result = profileFormSchema.safeParse(data);

      if (result.success) {
        if (data.userName) {
          try {
            const res = await fetchQuery<ProfileFormQuery>(
              environment,
              graphql`
                query ProfileFormQuery($userName: String!) {
                  profile(userName: $userName) {
                    id
                    userName
                  }
                }
              `,
              { userName: data.userName },
            ).toPromise();

            if (res?.profile?.userName === data.userName) {
              const { userName, ...values } = data;

              return {
                values,
                errors: {
                  userName: {
                    type: 'validation',
                    message: userNameAlreadyExistsError,
                  },
                },
              };
            }
          } catch (e) {
            //waiting for submit
          }
        }

        return {
          values: data,
          errors: {},
        };
      } else {
        return {
          values: {},
          errors: Object.entries(result.error.formErrors.fieldErrors).reduce(
            (allErrors, [path, message]) => ({
              ...allErrors,
              [path]: {
                type: 'validation',
                message: path === 'userName' ? userNameInvalidError : message,
              },
            }),
            {},
          ),
        };
      }
    },
  });

  const onSubmit = handleSubmit(async data => {
    if (!data.userName) {
      return;
    }

    let response: {
      token: string;
      refreshToken: string;
      profileId: string;
    };

    const newProfile = {
      ...data,
      profileKind,
      profileCategoryId,
    };

    try {
      response = await createProfile(newProfile);
    } catch (e) {
      if (e instanceof Error && e.message === ERRORS.USERNAME_ALREADY_EXISTS) {
        setError('userName', {
          type: 'validation',
          message: userNameAlreadyExistsError,
        });
      }

      // TODO
      return;
    }

    onProfileCreated({
      ...response,
      profileData: newProfile,
    });
  });

  const userName = watch('userName');
  const [debouncedUserName] = useDebounce(userName, 200);

  useEffect(() => {
    if (debouncedUserName) {
      void trigger('userName');
    }
  }, [debouncedUserName, trigger]);

  const lastNameInputRef = useRef<RNTextInput>(null);
  const userNameInputRef = useRef<RNTextInput>(null);

  const focusLastName = () => {
    lastNameInputRef.current?.focus();
  };

  const focusUserName = () => {
    userNameInputRef.current?.focus();
  };

  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const companyActivityKeyExtractor = useCallback(
    (item: CompanyActivity) => item.id,
    [],
  );

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <Form style={styles.form} onSubmit={onSubmit}>
        <NewProfileScreenPageHeader
          onBack={onBack}
          activeIndex={1}
          title={
            profileKind === 'personal' ? (
              <FormattedMessage
                defaultMessage="What's your name?"
                description="Personal profile form - Title"
              />
            ) : (
              <FormattedMessage
                defaultMessage="Provide more details"
                description="Company profile form - Title"
              />
            )
          }
          style={styles.header}
        />
        {profileKind === 'personal' ? (
          <>
            <Label
              label={intl.formatMessage({
                defaultMessage: 'First name',
                description: 'ProfileForm first name textinput label',
              })}
              labelID="firstNameLabel"
              style={styles.formElement}
            >
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    nativeID="firstName"
                    accessibilityLabelledBy="firstNameLabel"
                    placeholder={intl.formatMessage({
                      defaultMessage: 'Enter your first name',
                      description:
                        'ProfileForm first name textinput placeholder',
                    })}
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="words"
                    autoComplete="name"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={focusLastName}
                  />
                )}
              />
            </Label>
            <Label
              label={intl.formatMessage({
                defaultMessage: 'Last name',
                description: 'ProfileForm last name textinput label',
              })}
              labelID="lastNameLabel"
              style={styles.formElement}
            >
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    nativeID="lastName"
                    ref={lastNameInputRef}
                    accessibilityLabelledBy="lastNameLabel"
                    placeholder={intl.formatMessage({
                      defaultMessage: 'Enter your last name',
                      description:
                        'ProfileForm last name textinput placeholder',
                    })}
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="words"
                    autoComplete="name-family"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={focusUserName}
                  />
                )}
              />
            </Label>
          </>
        ) : (
          <>
            <Label
              labelID="nameLabel"
              label={intl.formatMessage({
                defaultMessage: 'Name',
                description: 'ProfileForm name textinput label',
              })}
              style={styles.formElement}
            >
              <Controller
                control={control}
                name="companyName"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    nativeID="name"
                    accessibilityLabelledBy="nameLabel"
                    placeholder={intl.formatMessage({
                      defaultMessage: 'Enter your name',
                      description:
                        'ProfileForm company name textinput placeholder',
                    })}
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="words"
                    autoComplete="name"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                )}
              />
            </Label>
            {!!companyActivities.length && (
              <Label
                labelID="activitiesLabel"
                label={intl.formatMessage({
                  defaultMessage: 'Activity',
                  description:
                    'NewProfile Name Company Screen - Label Activity textinput',
                })}
                style={styles.formElement}
              >
                <Controller
                  control={control}
                  name="companyActivityId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      nativeID="activities"
                      accessibilityLabelledBy="activitiesLabel"
                      data={companyActivities}
                      selectedItemKey={value}
                      keyExtractor={companyActivityKeyExtractor}
                      bottomSheetHeight={windowHeight - 90 - insets.top}
                      onItemSelected={item => onChange(item.id)}
                      bottomSheetTitle={intl.formatMessage({
                        defaultMessage: 'Select an activity',
                        description:
                          'ProfileForm - Activity BottomSheet - Title',
                      })}
                      placeHolder={intl.formatMessage({
                        defaultMessage: 'Select an activity',
                        description:
                          'NewProfile Name Company Screen - Accessibility TextInput Placeholder Choose a company activity',
                      })}
                      itemContainerStyle={styles.selectItemContainerStyle}
                    />
                  )}
                />
              </Label>
            )}
          </>
        )}
        <Controller
          name="userName"
          control={control}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <Label
                labelID="userNameLabel"
                label={intl.formatMessage({
                  defaultMessage: 'Username*',
                  description: 'ProfileForm username textinput label',
                })}
                error={error?.message}
                style={styles.formElement}
                errorStyle={{ minHeight: 25 }}
              >
                <TextInput
                  nativeID="userName"
                  accessibilityLabelledBy="userNameLabel"
                  ref={userNameInputRef}
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Choose an username',
                    description: 'ProfileForm username textinput placeholder',
                  })}
                  isErrored={Boolean(error)}
                  value={userName}
                  onChangeText={text => onChange(text.toLowerCase())}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={onSubmit}
                />
              </Label>
              <View style={styles.urlContainer}>
                {Boolean(value) && (
                  <>
                    <Icon
                      icon={error ? 'closeFull' : 'missing'}
                      style={{
                        tintColor: error ? colors.red400 : colors.green,
                      }}
                    />

                    <Text
                      variant="large"
                      style={[
                        styles.urlText,
                        error && { color: colors.red400 },
                      ]}
                    >
                      {buildUserUrl(userName)}
                    </Text>
                  </>
                )}
              </View>
            </>
          )}
        />
        <View style={{ flex: 1 }} />
        <Submit>
          <ContinueButton
            testID="submit-button"
            disabled={!isNotFalsyString(userName) || isSubmitting}
            loading={isSubmitting}
          />
        </Submit>
      </Form>
    </KeyboardAvoidingView>
  );
};

export default ProfileForm;

type CompanyActivity = ArrayItemType<
  ProfileForm_profileCategory$data['companyActivities']
>;

const styles = StyleSheet.create({
  selectItemContainerStyle: {
    marginBottom: 18,
    paddingHorizontal: 30,
  },
  root: {
    flex: 1,
    paddingTop: 50,
  },
  form: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  header: {
    marginBottom: 40,
  },
  formElement: {
    marginHorizontal: 20,
  },
  urlContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 20,
    marginBottom: 10,
  },
  urlText: {
    marginLeft: 5,
  },
});
