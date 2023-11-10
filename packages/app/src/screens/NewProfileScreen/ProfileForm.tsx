import {
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import {
  fetchQuery,
  graphql,
  useFragment,
  useMutation,
  useRelayEnvironment,
} from 'react-relay';
import { useDebounce } from 'use-debounce';
import * as z from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import useScreenInsets from '#hooks/useScreenInsets';
import Icon from '#ui/Icon';
import Label from '#ui/Label';
import Select from '#ui/Select';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type {
  ProfileForm_profileCategory$data,
  ProfileForm_profileCategory$key,
} from '@azzapp/relay/artifacts/ProfileForm_profileCategory.graphql';
import type { ProfileFormMutation } from '@azzapp/relay/artifacts/ProfileFormMutation.graphql';
import type { ProfileFormQuery } from '@azzapp/relay/artifacts/ProfileFormQuery.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ForwardedRef } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

type ProfileFormProps = {
  profileKind: string;
  profileCategory: ProfileForm_profileCategory$key;
  onProfileCreated: (profileId: string, userName: string) => void;
};

export type ProfileFormHandle = {
  onSubmit: () => void;
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

const ProfileForm = (
  { profileKind, profileCategory, onProfileCreated }: ProfileFormProps,
  forwardRef: ForwardedRef<ProfileFormHandle>,
) => {
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

  const { control, trigger, handleSubmit, setError, watch } =
    useForm<ProfileForm>({
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

  const [commit] = useMutation<ProfileFormMutation>(graphql`
    mutation ProfileFormMutation($input: CreateProfileInput!) {
      createProfile(input: $input) {
        profile {
          id
          userName
          firstName
          lastName
          companyName
          companyActivity {
            id
            label
          }
          profileCategory {
            id
            label
            profileKind
          }
          profileKind
          #required data on HomeScreen
          statsSummary {
            day
            contactcardScans
            webcardViews
            likes
          }
          ...ContactCard_profile
          nbPosts
          nbFollowings
          nbFollowers
          nbLikes
          nbPostsLiked
          nbWebcardViews
          nbContactCardScans
        }
      }
    }
  `);

  const onSubmit = handleSubmit(data => {
    if (!data.userName) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      commit({
        variables: {
          input: {
            ...data,
            profileCategoryId,
          },
        },
        updater: store => {
          const root = store.getRoot();
          const user = root.getLinkedRecord('currentUser');
          const profiles = user?.getLinkedRecords('profiles');
          if (!profiles) {
            return;
          }

          const newProfile = store
            .getRootField('createProfile')
            ?.getLinkedRecord('profile');

          if (!newProfile) {
            return;
          }

          user?.setLinkedRecords(
            profiles
              ?.concat(newProfile)
              .sort((a, b) =>
                ((a.getValue('userName') as string) ?? '').localeCompare(
                  (b.getValue('userName') as string) ?? '',
                ),
              ),
            'profiles',
          );
          root.setLinkedRecord(user, 'currentUser');
        },
        onCompleted: (data, errors) => {
          if (errors?.length) {
            if (errors[0].message === ERRORS.USERNAME_ALREADY_EXISTS) {
              setError('userName', {
                type: 'validation',
                message: userNameAlreadyExistsError,
              });
            }
            // TODO
            console.log(errors);
            reject(errors);
            return;
          }

          const { id, userName } = data.createProfile.profile;
          dispatchGlobalEvent({
            type: 'PROFILE_CHANGE',
            payload: {
              profileId: id,
            },
          }).finally(() => {
            onProfileCreated(id, userName);
            resolve();
          });
        },
        onError: error => {
          // TODO
          console.log(error);
          reject(error);
        },
      });
    });
  });

  useImperativeHandle(forwardRef, () => ({
    onSubmit,
  }));

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

  const insets = useScreenInsets();
  const { height: windowHeight } = useWindowDimensions();

  const companyActivityKeyExtractor = useCallback(
    (item: CompanyActivity) => item.id,
    [],
  );

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.root}
      keyboardVerticalOffset={250}
    >
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
                    description: 'ProfileForm first name textinput placeholder',
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
                    description: 'ProfileForm last name textinput placeholder',
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
                      description: 'ProfileForm - Activity BottomSheet - Title',
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
              label={
                intl.formatMessage(
                  {
                    defaultMessage: 'Webcard{azzappAp} name*',
                    description: 'ProfileForm username textinput label',
                  },
                  {
                    azzappAp: <Text variant="azzapp">a</Text>,
                  },
                ) as string
              }
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
                returnKeyType="next"
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
                    style={[styles.urlText, error && { color: colors.red400 }]}
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
    </KeyboardAvoidingView>
  );
};

export default forwardRef(ProfileForm);

type CompanyActivity = ArrayItemType<
  ProfileForm_profileCategory$data['companyActivities']
>;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
  formElement: {
    marginHorizontal: 20,
  },
  selectItemContainerStyle: {
    marginBottom: 18,
    paddingHorizontal: 30,
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
