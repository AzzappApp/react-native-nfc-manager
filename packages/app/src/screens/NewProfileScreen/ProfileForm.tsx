import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, KeyboardAvoidingView } from 'react-native';
import {
  fetchQuery,
  graphql,
  useFragment,
  useRelayEnvironment,
} from 'react-relay';
import { useDebounce } from 'use-debounce';
import ERRORS from '@azzapp/shared/errors';
import {
  isNotFalsyString,
  isValidUserName,
} from '@azzapp/shared/stringHelpers';
import { useWebAPI } from '#PlatformEnvironment';
import { colors } from '#theme';
import { buildUserUrl } from '#helpers/urlHelpers';
import useViewportSize, { VH100, insetTop } from '#hooks/useViewportSize';
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
import type { TextInput as RNTextInput } from 'react-native';

type ProfileForm = {
  profileKind: string;
  profileCategory: ProfileForm_profileCategory$key;
  onBack: () => void;
  onProfileCreated: (tokenResponse: {
    token: string;
    refreshToken: string;
    profileId: string;
  }) => void;
};

const ProfileForm = ({
  profileKind,
  profileCategory,
  onProfileCreated,
  onBack,
}: ProfileForm) => {
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

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyActivityId, setCompanyActivityId] = useState<string | null>(
    null,
  );
  const [userName, setUserName] = useState('');
  const [userNameAlreadyExists, setUserNameAlreadyExists] = useState<
    string | null
  >(null);

  const onActivitySelected = useCallback(
    (item: CompanyActivity) => {
      setCompanyActivityId(item.id);
    },
    [setCompanyActivityId],
  );
  const onChangeUsername = useCallback((text: string) => {
    setUserName(text.toLowerCase());
  }, []);
  const userNameIsValid = isValidUserName(userName);
  const userNameIsNotEmpty = isNotFalsyString(userName);

  const { createProfile } = useWebAPI();
  const [loading, setLoading] = useState(false);
  const onSubmit = async () => {
    if (!userNameIsValid || !userNameIsNotEmpty) {
      return;
    }

    setLoading(true);
    let response: {
      token: string;
      refreshToken: string;
      profileId: string;
    };
    try {
      response = await createProfile({
        companyName,
        companyActivityId,
        firstName,
        lastName,
        profileKind,
        profileCategoryId,
        userName,
      });
    } catch (e) {
      if (e instanceof Error && e.message === ERRORS.USERNAME_ALREADY_EXISTS) {
        setUserNameAlreadyExists(userName);
      }
      setLoading(false);
      // TODO
      return;
    }
    onProfileCreated(response);
  };

  const [debouncedUserName] = useDebounce(userName, 200);

  const environment = useRelayEnvironment();
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    if (
      isNotFalsyString(debouncedUserName) &&
      isValidUserName(debouncedUserName) &&
      !loading
    ) {
      subscription = fetchQuery<ProfileFormQuery>(
        environment,
        graphql`
          query ProfileFormQuery($userName: String!) {
            profile(userName: $userName) {
              id
              userName
            }
          }
        `,
        { userName: debouncedUserName },
      ).subscribe({
        next(data) {
          if (data.profile?.userName === debouncedUserName) {
            setUserNameAlreadyExists(debouncedUserName);
          }
        },
        error(e: any) {
          // TODO
          console.log(e);
        },
      });
    }
    return () => {
      subscription?.unsubscribe();
    };
  }, [debouncedUserName, environment, loading]);

  const lastNameInputRef = useRef<RNTextInput>(null);
  const userNameInputRef = useRef<RNTextInput>(null);

  const focusLastName = () => {
    lastNameInputRef.current?.focus();
  };

  const focusUserName = () => {
    userNameInputRef.current?.focus();
  };

  const vp = useViewportSize();
  const intl = useIntl();

  const userNameInvalidError = intl.formatMessage({
    defaultMessage: 'Username can’t contain space or special caracters',
    description: 'NewProfileScreen - Username Error',
  });

  const userNameAlreadyExistsError = intl.formatMessage({
    defaultMessage: 'This username is already used by someone else',
    description: 'NewProfileScreen - Username already taken error',
  });

  const userNameError =
    userNameIsNotEmpty && !userNameIsValid
      ? userNameInvalidError
      : userNameAlreadyExists === userName
      ? userNameAlreadyExistsError
      : undefined;

  const companyActivityKeyExtractor = useCallback(
    (item: CompanyActivity) => item.id,
    [],
  );

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[
        styles.root,
        {
          paddingTop: vp`${insetTop} + ${50}`,
        },
      ]}
    >
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
              <TextInput
                nativeID="firstName"
                accessibilityLabelledBy="firstNameLabel"
                placeholder={intl.formatMessage({
                  defaultMessage: 'Enter your first name',
                  description: 'ProfileForm first name textinput placeholder',
                })}
                value={firstName ?? ''}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={focusLastName}
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
              <TextInput
                nativeID="lastName"
                ref={lastNameInputRef}
                accessibilityLabelledBy="lastNameLabel"
                placeholder={intl.formatMessage({
                  defaultMessage: 'Enter your last name',
                  description: 'ProfileForm last name textinput placeholder',
                })}
                value={lastName ?? ''}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoComplete="name-family"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={focusUserName}
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
              <TextInput
                nativeID="name"
                accessibilityLabelledBy="nameLabel"
                placeholder={intl.formatMessage({
                  defaultMessage: 'Enter your name',
                  description: 'ProfileForm company name textinput placeholder',
                })}
                value={companyName ?? ''}
                onChangeText={setCompanyName}
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect={false}
                returnKeyType="next"
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
                <Select
                  nativeID="activities"
                  accessibilityLabelledBy="activitiesLabel"
                  data={companyActivities}
                  selectedItemKey={companyActivityId}
                  keyExtractor={companyActivityKeyExtractor}
                  bottomSheetHeight={vp`${VH100} - ${90} - ${insetTop}`}
                  onItemSelected={onActivitySelected}
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
              </Label>
            )}
          </>
        )}
        <Label
          labelID="userNameLabel"
          label={intl.formatMessage({
            defaultMessage: 'Username*',
            description: 'ProfileForm username textinput label',
          })}
          error={userNameError}
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
            isErrored={userNameError != null}
            value={userName}
            onChangeText={onChangeUsername}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
          />
        </Label>
        <View style={styles.urlContainer}>
          {userNameIsNotEmpty && (
            <>
              <Icon
                icon={userNameError ? 'closeFull' : 'missing'}
                style={{
                  tintColor: userNameError ? colors.red400 : colors.green,
                }}
              />

              <Text
                variant="large"
                style={[
                  styles.urlText,
                  userNameError != null && { color: colors.red400 },
                ]}
              >
                {buildUserUrl(userName)}
              </Text>
            </>
          )}
        </View>
        <View style={{ flex: 1 }} />
        <Submit>
          <ContinueButton
            testID="submit-button"
            disabled={!userNameIsNotEmpty || loading}
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
