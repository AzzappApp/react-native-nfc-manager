import { useEffect } from 'react';
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
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
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
    userName: string;
  };
};
const WebcardParametersNameForm = ({
  webCard,
  visible,
  toggleBottomSheet,
}: WebcardParametersNameFormProps) => {
  const {
    control,
    handleSubmit,
    setError,
    watch,
    trigger,
    formState: { isSubmitting, errors },
  } = useForm<UserNameForm>({
    defaultValues: {
      userName: webCard.userName,
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
                  userNameAvailable(userName: $userName)
                }
              `,
              { userName: data.userName },
            ).toPromise();

            if (!res?.userNameAvailable && userName !== webCard.userName) {
              return {
                values: {},
                errors: {
                  userName: {
                    type: 'validation',
                    message: userNameAlreadyExistsError,
                  },
                },
              };
            }
          } catch (e) {
            //waiting for submi5
          }
        }

        return {
          values: data,
          errors: {},
        };
      } else {
        return {
          values: {},
          errors: {
            userName: {
              type: 'validation',
              message: userNameInvalidError,
            },
          },
        };
      }
    },
  });

  const intl = useIntl();

  const userNameAlreadyExistsError = intl.formatMessage({
    defaultMessage: 'This username is already used by someone else',
    description: 'Webcardparameters name form - Username already taken error',
  });

  const userNameInvalidError = intl.formatMessage({
    defaultMessage: 'Username can’t contain space or special characters',
    description: 'Webcardparameters name form - Username Error',
  });

  const environment = useRelayEnvironment();

  const insets = useScreenInsets();

  const [commitMutation] = useMutation(graphql`
    mutation WebCardParametersNameFormMutation(
      $input: UpdateWebCardUserNameInput!
    ) {
      updateWebCardUserName(input: $input) {
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
        input: {
          userName,
          webCardId: webCard.id,
        },
      },
      onCompleted: () => {
        toggleBottomSheet();
      },
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
            message: intl.formatMessage({
              defaultMessage: 'This username is already used',
              description:
                'WebcardParameters Name form - Error This userName is already used ',
            }),
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
            ) as string,
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

  useEffect(() => {
    if (debouncedUserName) {
      void trigger('userName');
    }
  }, [debouncedUserName, trigger]);

  return (
    <BottomSheetModal
      visible={visible}
      height={insets.bottom + 160}
      onRequestClose={toggleBottomSheet}
      headerTitle={intl.formatMessage({
        defaultMessage: 'Edit your name',
        description: 'Edit Webcard Name modal title',
      })}
      showGestureIndicator={false}
      headerLeftButton={
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
      headerRightButton={
        <Button
          loading={isSubmitting}
          disabled={isSubmitting || webCard.userName === userName}
          label={intl.formatMessage({
            defaultMessage: 'Save',
            description: 'Edit Webcard Name modal save button label',
          })}
          onPress={onSubmit}
          variant="primary"
          style={styles.headerButton}
        />
      }
    >
      <View style={styles.controllerContainer}>
        <Controller
          control={control}
          name="userName"
          render={({ field: { onChange, value }, formState: { errors } }) => (
            <View style={{ flex: 1, height: 50 }}>
              <TextInput
                nativeID="userName"
                accessibilityLabelledBy="userNameLabel"
                placeholder={intl.formatMessage({
                  defaultMessage: 'Choose an username',
                  description: 'ProfileForm username textinput placeholder',
                })}
                isErrored={errors.userName != null}
                value={value}
                onChangeText={text => onChange(text.toLowerCase())}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={onSubmit}
              />
            </View>
          )}
        />
      </View>
      {errors.userName ? (
        <Text variant="error">{errors.userName.message}</Text>
      ) : null}
      {errors.root?.server ? (
        <Text variant="error">{errors.root.server.message}</Text>
      ) : null}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  controllerContainer: {
    paddingTop: 10,
    gap: 5,
    flexDirection: 'row',
    width: '100%',
  },
});

export default WebcardParametersNameForm;
