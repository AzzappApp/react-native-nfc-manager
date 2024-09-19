import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import {
  fetchQuery,
  graphql,
  useMutation,
  usePreloadedQuery,
  useRelayEnvironment,
} from 'react-relay';
import { useDebounce } from 'use-debounce';
import * as z from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { buildReadableUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import { NextHeaderButton } from '#components/commonsButtons';
import { useRouter } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { onChangeWebCard } from '#helpers/authStore';
import { keyExtractor } from '#helpers/idHelpers';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import Label from '#ui/Label';
import SearchBarStatic from '#ui/SearchBarStatic';
import SelectSection from '#ui/SelectSection';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import WizardPagerHeader from '#ui/WizardPagerHeader';
import createWizardScreenFallback from '#ui/WizardScreenFallback';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { WebCardFormScreenCheckUserNameQuery } from '#relayArtifacts/WebCardFormScreenCheckUserNameQuery.graphql';
import type { WebCardFormScreenMutation } from '#relayArtifacts/WebCardFormScreenMutation.graphql';
import type { WebCardFormScreenQuery } from '#relayArtifacts/WebCardFormScreenQuery.graphql';
import type { WebCardFormRoute } from '#routes';
import type { TextInput as RNTextInput } from 'react-native';

const query = graphql`
  query WebCardFormScreenQuery($webCardCategoryId: ID!) {
    currentUser {
      isPremium
    }
    webCardCategory: node(id: $webCardCategoryId) {
      ... on WebCardCategory {
        id
        webCardKind
        companyActivities {
          id
          label
          companyActivityType {
            id
            label
          }
        }
      }
    }
  }
`;

const WebCardFormScreen = ({
  preloadedQuery,
}: RelayScreenProps<WebCardFormRoute, WebCardFormScreenQuery>) => {
  const { webCardCategory, currentUser } = usePreloadedQuery(
    query,
    preloadedQuery,
  );
  const {
    id: webCardCategoryId,
    webCardKind,
    companyActivities,
  } = webCardCategory ?? {};

  const router = useRouter();
  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onNext = useCallback(() => {
    router.splice({ route: 'COVER_TEMPLATE_SELECTION' }, 2);
  }, [router]);

  const [searchActivities, setSearchActivities] = useState('');

  const intl = useIntl();

  const otherActivityType = intl.formatMessage({
    defaultMessage: 'Other',
    description: 'Default activity type label',
  });

  const filteredCompanyActivities = useMemo(() => {
    if (!companyActivities) {
      return [];
    }
    const filteredActivities = searchActivities.trim()
      ? companyActivities?.filter(activity =>
          activity.label
            ?.toLowerCase()
            .includes(searchActivities.toLowerCase()),
        )
      : companyActivities;

    return filteredActivities.reduce<
      Array<{ title: string; data: [{ id: string; title: string }] }>
    >((acc, activity) => {
      const type = acc.find(
        a =>
          a.title ===
          (activity.companyActivityType?.label ?? otherActivityType),
      );

      if (type) {
        type.data.push({
          id: activity.id,
          title: activity.label ?? '',
        });

        type.data = type.data.sort((a, b) => {
          return a.title.localeCompare(b.title);
        });
      } else {
        acc.push({
          title: activity.companyActivityType?.label ?? otherActivityType,
          data: [
            {
              id: activity.id,
              title: activity.label ?? '',
            },
          ],
        });

        acc = acc.sort((a, b) => {
          return a.title.localeCompare(b.title);
        });
      }

      return acc;
    }, []);
  }, [companyActivities, otherActivityType, searchActivities]);

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

  const {
    control,
    trigger,
    handleSubmit,
    setError,
    watch,
    setValue,
    getValues,
    getFieldState,
  } = useForm<WebCardForm>({
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
            const res = await fetchQuery<WebCardFormScreenCheckUserNameQuery>(
              environment,
              graphql`
                query WebCardFormScreenCheckUserNameQuery($userName: String!) {
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
          } catch {
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

  const onUpdateField = useCallback(
    (text: string, field: 'companyName' | 'firstName' | 'lastName') => {
      if (getFieldState('userName').isDirty) {
        return;
      }
      const [firstName, lastName] = getValues(['firstName', 'lastName']);
      switch (field) {
        case 'companyName':
          setValue('userName', text.toLowerCase());
          break;
        case 'firstName':
          setValue(
            'userName',
            `${text.toLowerCase()}${lastName.toLowerCase()}`,
          );
          break;
        case 'lastName':
          setValue(
            'userName',
            `${firstName.toLowerCase()}${text.toLowerCase()}`,
          );
          break;
      }
    },
    [getFieldState, getValues, setValue],
  );

  const [commit, saving] = useMutation<WebCardFormScreenMutation>(graphql`
    mutation WebCardFormScreenMutation($input: CreateWebCardInput!) {
      createWebCard(input: $input) {
        profile {
          id
          profileRole
          #required data on HomeScreen
          ...ContactCard_profile
          nbContactCardScans
          nbShareBacks
          statsSummary {
            contactCardScans
            shareBacks
          }
          lastContactCardUpdate
          createdAt
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
            isWebSubscription
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

  const isSubmitting = useRef(false);
  const onSubmit = handleSubmit(data => {
    if (!data.userName || isSubmitting.current) {
      return;
    }
    isSubmitting.current = true;

    const defaultActivity = companyActivities?.[0];
    const defaultActivityId = defaultActivity?.id;

    commit({
      variables: {
        input: {
          ...data,
          webCardCategoryId: webCardCategoryId!,
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
      onCompleted: data => {
        const {
          id: profileId,
          profileRole,
          webCard,
        } = data.createWebCard.profile;
        if (!webCard) {
          throw new Error('WebCard not created');
        }
        onChangeWebCard({
          profileId,
          webCardId: webCard.id,
          profileRole: profileRole!,
        }).finally(() => {
          onNext();
        });
      },
      onError: error => {
        isSubmitting.current = false;
        if (error.message === ERRORS.USERNAME_ALREADY_EXISTS) {
          setError('userName', {
            type: 'validation',
            message: userNameAlreadyExistsError,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'An error occurred',
              description: 'Error toast message',
            }),
          });
        }
      },
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

  const insets = useScreenInsets();
  const { height: windowHeight } = useWindowDimensions();

  return (
    <Container
      style={{
        flex: 1,
        paddingTop: insets.top,
      }}
    >
      <WizardPagerHeader
        title={
          webCardKind === 'personal' ? (
            intl.formatMessage({
              defaultMessage: 'Add WebCard details',
              description: 'Add WebCard details screen title',
            })
          ) : (
            <View style={styles.headerTextContainer}>
              <Text variant="large">
                <FormattedMessage
                  defaultMessage="Add WebCard details"
                  description="Add WebCard details screen title"
                />
              </Text>
              {currentUser?.isPremium ? null : (
                <View style={styles.proContainer}>
                  <Text variant="medium" style={styles.proText}>
                    <FormattedMessage
                      description="NewWebCardScreen - Description for pro category"
                      defaultMessage="azzapp+ WebCard{azzappA}"
                      values={{ azzappA: <Text variant="azzapp">a</Text> }}
                    />
                  </Text>
                  <PremiumIndicator isRequired />
                </View>
              )}
            </View>
          )
        }
        rightElement={
          <NextHeaderButton
            style={{ width: 70, marginRight: 10 }}
            onPress={onSubmit}
            loading={saving}
          />
        }
        rightElementWidth={80}
        backIcon="arrow_left"
        currentPage={1}
        nbPages={5}
        onBack={onBack}
      />
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
                      description:
                        'ProfileForm first name textinput placeholder',
                    })}
                    value={value}
                    onChangeText={(text: string) => {
                      onChange(text);
                      onUpdateField(text, 'firstName');
                    }}
                    autoCapitalize="words"
                    autoComplete="name"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={focusLastName}
                    autoFocus
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
                    onChangeText={(text: string) => {
                      onChange(text);
                      onUpdateField(text, 'lastName');
                    }}
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
                    onChangeText={(text: string) => {
                      onChange(text);
                      onUpdateField(text, 'companyName');
                    }}
                    autoCapitalize="words"
                    autoComplete="name"
                    autoCorrect={false}
                    returnKeyType="next"
                    autoFocus
                  />
                )}
              />
            </Label>
            {!!companyActivities?.length && (
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
                    <SelectSection
                      nativeID="activities"
                      accessibilityLabelledBy="activitiesLabel"
                      sections={filteredCompanyActivities}
                      selectedItemKey={value}
                      keyExtractor={keyExtractor}
                      avoidKeyboard
                      bottomSheetHeight={windowHeight - 90 - insets.top}
                      inputLabel={
                        value
                          ? companyActivities.find(
                              activity => activity.id === value,
                            )?.label ?? undefined
                          : undefined
                      }
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
                      ListHeaderComponent={
                        <View style={styles.searchContainer}>
                          <SearchBarStatic
                            placeholder={intl.formatMessage({
                              defaultMessage: 'Search an activity',
                              description:
                                'WebCardParameters screen - Activity SearchBar - Placeholder',
                            })}
                            onChangeText={text =>
                              setSearchActivities(text ?? '')
                            }
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
                label={intl.formatMessage(
                  {
                    defaultMessage:
                      'Webcard{azzappA} name* (You can modify it later)',
                    description: 'ProfileForm username textinput label',
                  },
                  {
                    azzappA: <Text variant="azzapp">a</Text>,
                  },
                )}
                error={error?.message}
                style={styles.formElement}
                errorStyle={{ minHeight: 25 }}
              >
                <TextInput
                  nativeID="userName"
                  accessibilityLabelledBy="userNameLabel"
                  ref={userNameInputRef}
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Select a WebCard name"',
                    description: 'ProfileForm username textinput placeholder',
                  })}
                  isErrored={Boolean(error)}
                  value={userName}
                  onChangeText={text => {
                    onChange(text.toLowerCase());
                  }}
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
                      style={[
                        styles.urlText,
                        error && { color: colors.red400 },
                      ]}
                    >
                      {buildReadableUserUrl(userName)}
                    </Text>
                  </>
                )}
              </View>
            </>
          )}
        />
        <View style={{ flex: 1 }} />
      </KeyboardAvoidingView>
    </Container>
  );
};

export default relayScreen(WebCardFormScreen, {
  query,
  getVariables: ({ webCardCategoryId }) => ({ webCardCategoryId }),
  profileBound: false,
  fallback: createWizardScreenFallback({
    currentPage: 1,
    nbPages: 5,
    backIcon: 'arrow_left',
  }),
});

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
  searchContainer: { paddingBottom: 20 },
  headerTextContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  proText: {
    color: colors.grey400,
  },
  proContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
