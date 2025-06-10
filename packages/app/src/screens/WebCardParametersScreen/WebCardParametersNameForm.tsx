import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import {
  fetchQuery,
  graphql,
  useMutation,
  useRelayEnvironment,
} from 'react-relay';
import { useDebounce } from 'use-debounce';
import { z } from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import Button from '#ui/Button';
import Header from '#ui/Header';
import InputAccessoryView from '#ui/InputAccessoryView';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type { WebCardParametersNameFormQuery } from '#relayArtifacts/WebCardParametersNameFormQuery.graphql';
import type { GraphQLError } from 'graphql';

const userNameFormSchema = z.object({
  userName: z.string().refine(userName => isValidUserName(userName), {
    message: 'Username can’t contain space or special caracters',
  }),
});

type UserNameForm = z.infer<typeof userNameFormSchema>;
type WebcardParametersNameFormProps = {
  visible: boolean;
  toggleBottomSheet: () => void;
  webCard: {
    id: string;
    userName?: string | null;
  };
};
const WebcardParametersNameForm = ({
  webCard,
  visible,
  toggleBottomSheet,
}: WebcardParametersNameFormProps) => {
  const lastErrorSend = useRef({
    values: {},
    errors: {},
  });

  const {
    control,
    handleSubmit,
    setError,
    watch,
    trigger,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<UserNameForm>({
    defaultValues: {
      userName: webCard.userName || '',
    },
    resetOptions: {
      keepDefaultValues: false,
      keepDirtyValues: false,
      keepDirty: false,
    },
    mode: 'onSubmit',
    resolver: async data => {
      const result = userNameFormSchema.safeParse(data);

      if (result.success) {
        if (data.userName) {
          try {
            const res = await fetchQuery<WebCardParametersNameFormQuery>(
              environment,
              graphql`
                query WebCardParametersNameFormQuery($userName: String!) {
                  isUserNameAvailable(userName: $userName) {
                    userName
                  }
                }
              `,
              { userName: data.userName },
            ).toPromise();

            if (res?.isUserNameAvailable.userName !== data.userName) {
              // form username changed during validation
              return lastErrorSend.current;
            }
            if (!res?.isUserNameAvailable && userName === webCard.userName) {
              lastErrorSend.current = {
                values: {},
                errors: {
                  userName: {
                    type: 'validation',
                    message: userNameAlreadyExistsError,
                  },
                },
              };
              return lastErrorSend.current;
            }
          } catch {
            //waiting for submi5
          }
        }
        lastErrorSend.current = {
          values: data,
          errors: {},
        };
        return lastErrorSend.current;
      } else {
        lastErrorSend.current = {
          values: {},
          errors: {
            userName: {
              type: 'validation',
              message: userNameInvalidError,
            },
          },
        };
        return lastErrorSend.current;
      }
    },
  });

  useEffect(() => {
    if (visible) {
      reset({
        userName: webCard.userName ?? '',
      });
    }
  }, [reset, visible, webCard.userName]);

  const intl = useIntl();

  const userNameAlreadyExistsError = intl.formatMessage({
    defaultMessage: 'This WebCard name is already registered',
    description: 'Webcardparameters name form - Username already taken error',
  });

  const userNameInvalidError = intl.formatMessage(
    {
      defaultMessage:
        'WebCard{azzappA} name can not contain space or special characters',
      description: 'Webcardparameters name form - Username Error',
    },
    {
      azzappA: <Text variant="azzapp">a</Text>,
    },
  );

  const environment = useRelayEnvironment();

  const [commitMutation, isLoading] = useMutation(graphql`
    mutation WebCardParametersNameFormMutation(
      $webCardId: ID!
      $input: UpdateWebCardInput!
    ) {
      updateWebCard(webCardId: $webCardId, input: $input) {
        webCard {
          id
          userName
          lastUserNameUpdate
          nextChangeUsernameAllowedAt
        }
      }
    }
  `);

  const onSubmit = handleSubmit(async ({ userName }) => {
    commitMutation({
      variables: {
        webCardId: webCard.id,
        input: {
          userName,
        },
      },
      onCompleted: toggleBottomSheet,
      onError: error => {
        const response = ('response' in error ? error.response : undefined) as
          | { errors: GraphQLError[] }
          | undefined;
        if (
          response?.errors.some(
            r => r.message === ERRORS.USERNAME_ALREADY_EXISTS,
          )
        ) {
          setError('root.server', {
            message: intl.formatMessage(
              {
                defaultMessage:
                  'This WebCard{azzappA} name is already registered',
                description:
                  'WebcardParameters Name form - Error This userName is already used ',
              },
              {
                azzappA: (
                  <Text variant="azzapp" style={{ color: colors.red400 }}>
                    a
                  </Text>
                ),
              },
            ) as unknown as string,
          });
        } else if (
          response?.errors.some(
            r => r.message === ERRORS.USERNAME_CHANGE_NOT_ALLOWED_DELAY,
          )
        ) {
          //it should not happen unless we have different value between server and client
          const error = response?.errors.find(
            r => r.message === ERRORS.USERNAME_CHANGE_NOT_ALLOWED_DELAY,
          );
          setError('root.server', {
            message: intl.formatMessage(
              {
                defaultMessage: `You will be able to change your WebCard{azzappA} name after {dateChange}.`,
                description:
                  'WebcardParameters Name form - Error This userName is already used ',
              },
              {
                azzappA: (
                  <Text variant="azzapp" style={{ color: colors.red400 }}>
                    a
                  </Text>
                ),
                dateChange: error?.extensions.alloweChangeUserNameDate
                  ? `${intl.formatDate(
                      error?.extensions.alloweChangeUserNameDate as string,
                    )} at ${intl.formatTime(
                      error?.extensions.alloweChangeUserNameDate as string,
                    )}`
                  : 'unknown date',
              },
            ) as unknown as string,
          });
        } else {
          setError('root.server', {
            message: intl.formatMessage({
              defaultMessage: 'Unknown error - Please retry',
              description:
                'WebcardParameters Name form - Error Unknown error - Please retry',
            }),
          });
        }
      },
    });
  });

  const userName = watch('userName');
  const [debouncedUserName] = useDebounce(userName, 200);

  const userNameError = webCard.userName !== userName && errors.userName;

  useEffect(() => {
    if (debouncedUserName) {
      void trigger('userName');
    }
  }, [debouncedUserName, trigger]);

  return (
    <InputAccessoryView visible={visible} onClose={toggleBottomSheet}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Edit your name',
          description: 'Edit Webcard Name modal title',
        })}
        leftElement={
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Edit Webcard Name modal cancel button label',
            })}
            onPress={toggleBottomSheet}
            variant="secondary"
            style={styles.headerButton}
          />
        }
        rightElement={
          <Button
            loading={isSubmitting || isLoading}
            disabled={
              isSubmitting || isLoading || webCard.userName === userName
            }
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Edit Webcard Name modal save button label',
            })}
            onPress={onSubmit}
            variant="primary"
            style={styles.headerButton}
          />
        }
        style={styles.header}
      />

      <View style={styles.controllerContainer}>
        <Controller
          control={control}
          name="userName"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                nativeID="userName"
                accessibilityLabelledBy="userNameLabel"
                placeholder={intl.formatMessage({
                  defaultMessage: 'Select a WebCard name',
                  description: 'ProfileForm username textinput placeholder',
                })}
                isErrored={!!userNameError}
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={onSubmit}
                autoFocus
              />
            </View>
          )}
        />
      </View>
      <View style={styles.errorMessage}>
        {userNameError ? (
          <Text variant="error">{userNameError.message}</Text>
        ) : null}
        {errors.root?.server ? (
          <Text variant="error">{errors.root.server.message}</Text>
        ) : null}
      </View>
    </InputAccessoryView>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 10 },
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  inputContainer: { flex: 1, height: 50, paddingHorizontal: 10 },
  errorMessage: { paddingHorizontal: 10 },
  controllerContainer: {
    paddingVertical: 10,
    gap: 5,
    flexDirection: 'row',
    width: '100%',
  },
});

export default WebcardParametersNameForm;
