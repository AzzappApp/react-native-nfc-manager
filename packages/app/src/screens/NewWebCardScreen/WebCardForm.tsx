import {
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useMemo,
} from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
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
import SearchBarStatic from '#ui/SearchBarStatic';
import Select from '#ui/Select';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type {
  WebCardForm_webCardCategory$data,
  WebCardForm_webCardCategory$key,
} from '#relayArtifacts/WebCardForm_webCardCategory.graphql';
import type { WebCardFormMutation } from '#relayArtifacts/WebCardFormMutation.graphql';
import type { WebCardFormQuery } from '#relayArtifacts/WebCardFormQuery.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ForwardedRef } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

type ProfileFormProps = {
  webCardKind: string;
  webCardCategory: WebCardForm_webCardCategory$key;
  onWebCardCreated: (
    profileId: string,
    webCardId: string,
    userName: string,
  ) => void;
};

export type ProfileFormHandle = {
  onSubmit: () => void;
};

const webCardFormSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  companyName: z.string(),
  companyActivityId: z.string(),
  userName: z.string().refine(userName => isValidUserName(userName), {
    message: 'Username can’t contain space or special caracters',
  }),
});

type WebCardForm = z.infer<typeof webCardFormSchema>;

const { height: windowHeight } = Dimensions.get('screen');

const WebCardForm = (
  { webCardKind, webCardCategory, onWebCardCreated }: ProfileFormProps,
  forwardRef: ForwardedRef<ProfileFormHandle>,
) => {
  const { id: webCardCategoryId, companyActivities } = useFragment(
    graphql`
      fragment WebCardForm_webCardCategory on WebCardCategory {
        id
        companyActivities {
          id
          label
        }
      }
    `,
    webCardCategory,
  );

  const [searchActivities, setSearchActivities] = useState('');

  const filteredCompanyActivities = useMemo(
    () =>
      searchActivities.trim()
        ? companyActivities.filter(activity =>
            activity.label
              ?.toLowerCase()
              .includes(searchActivities.toLowerCase()),
          )
        : companyActivities,
    [companyActivities, searchActivities],
  );

  const intl = useIntl();

  const userNameAlreadyExistsError = intl.formatMessage(
    {
      defaultMessage: 'This WebCard{azzappA} name is already registered',
      description: 'NewProfileScreen - Username already taken error',
    },
    {
      azzappA: <Text variant="azzapp">a</Text>,
    },
  ) as string;

  const userNameInvalidError = intl.formatMessage(
    {
      defaultMessage:
        'WebCard{azzappA} name can not contain space or special characters',
      description: 'NewProfileScreen - Username Error',
    },
    {
      azzappA: <Text variant="azzapp">a</Text>,
    },
  );

  const environment = useRelayEnvironment();

  const { control, trigger, handleSubmit, setError, watch } =
    useForm<WebCardForm>({
      defaultValues: {
        firstName: '',
        lastName: '',
        companyName: '',
        companyActivityId: '',
        userName: '',
      },
      mode: 'onSubmit',
      resolver: async data => {
        const result = webCardFormSchema.safeParse(data);

        if (result.success) {
          if (data.userName) {
            try {
              const res = await fetchQuery<WebCardFormQuery>(
                environment,
                graphql`
                  query WebCardFormQuery($userName: String!) {
                    userNameAvailable(userName: $userName)
                  }
                `,
                { userName: data.userName },
              ).toPromise();
              if (!res?.userNameAvailable) {
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

  const [commit] = useMutation<WebCardFormMutation>(graphql`
    mutation WebCardFormMutation($input: CreateWebCardInput!) {
      createWebCard(input: $input) {
        profile {
          id
          profileRole
          #required data on HomeScreen
          ...ContactCard_profile
          nbContactCardScans
          statsSummary {
            contactCardScans
          }
          webCard {
            id
            userName
            firstName
            lastName
            companyName
            companyActivity {
              id
              label
            }
            webCardCategory {
              id
              label
              webCardKind
            }
            webCardKind
            nbPosts
            nbFollowings
            nbFollowers
            nbLikes
            nbPostsLiked
            nbWebCardViews
            statsSummary {
              day
              webCardViews
              likes
            }
          }
        }
      }
    }
  `);

  const onSubmit = handleSubmit(data => {
    if (!data.userName) {
      return;
    }

    const defaultActivity = companyActivities[0];
    const defaultActivityId = defaultActivity ? defaultActivity.id : undefined;

    return new Promise<void>((resolve, reject) => {
      commit({
        variables: {
          input: {
            ...data,
            webCardCategoryId,
            companyActivityId: data.companyActivityId || defaultActivityId,
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
            .getRootField('createWebCard')
            ?.getLinkedRecord('profile');

          if (!newProfile) {
            return;
          }

          user?.setLinkedRecords(
            profiles?.concat(newProfile).sort((a, b) => {
              const webCardA = a.getLinkedRecord('webCard');
              const webCardB = b.getLinkedRecord('webCard');

              return (
                (webCardA?.getValue('userName') as string) ?? ''
              ).localeCompare((webCardB?.getValue('userName') as string) ?? '');
            }),
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

          const {
            id: profileId,
            profileRole,
            webCard,
          } = data.createWebCard.profile;
          dispatchGlobalEvent({
            type: 'WEBCARD_CHANGE',
            payload: {
              profileId,
              webCardId: webCard.id,
              profileRole: profileRole!,
            },
          }).finally(() => {
            onWebCardCreated(profileId, webCard.id, webCard.userName);
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
      {webCardKind === 'personal' ? (
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
                    data={filteredCompanyActivities}
                    selectedItemKey={value}
                    keyExtractor={companyActivityKeyExtractor}
                    bottomSheetHeight={
                      windowHeight -
                      90 -
                      insets.top -
                      (StatusBar.currentHeight ?? 0)
                    }
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
                    ListHeaderComponent={
                      <View style={styles.searchContainer}>
                        <SearchBarStatic
                          placeholder={intl.formatMessage({
                            defaultMessage: 'Search an activity',
                            description:
                              'WebCardParameters screen - Activity SearchBar - Placeholder',
                          })}
                          onChangeText={text => setSearchActivities(text ?? '')}
                          value={searchActivities}
                        />
                      </View>
                    }
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
                    defaultMessage:
                      'Webcard{azzappA} name* (You can modify it later)',
                    description: 'ProfileForm username textinput label',
                  },
                  {
                    azzappA: <Text variant="azzapp">a</Text>,
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
                placeholder={
                  intl.formatMessage(
                    {
                      defaultMessage: 'Select a WebCard{azzappA} name"',
                      description: 'ProfileForm username textinput placeholder',
                    },
                    {
                      azzappA: <Text variant="azzapp">a</Text>,
                    },
                  ) as string
                }
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

export default forwardRef(WebCardForm);

type CompanyActivity = ArrayItemType<
  WebCardForm_webCardCategory$data['companyActivities']
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
  searchContainer: { paddingBottom: 20, paddingHorizontal: 20 },
});
