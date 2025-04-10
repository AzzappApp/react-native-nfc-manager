import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Alert,
  StyleSheet,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Image as ImageCompressor } from 'react-native-compressor';
import * as mime from 'react-native-mime-types';
import Toast from 'react-native-toast-message';
import {
  ConnectionHandler,
  graphql,
  useFragment,
  useMutation,
  usePreloadedQuery,
} from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { colors } from '#theme';
import { CancelHeaderButton } from '#components/commonsButtons';
import { useRouter, type ScreenOptions } from '#components/NativeRouter';
import ProfileStatisticsChart, {
  normalizeArray,
} from '#components/ProfileStatisticsChart';
import { contactCardFormFragment } from '#fragments/ContactCardEditFormFragment';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getFileName } from '#helpers/fileHelpers';
import { keyExtractor } from '#helpers/idHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import {
  getPhonenumberWithCountryCode,
  parsePhoneNumber,
  parseContactCardPhoneNumber,
} from '#helpers/phoneNumbersHelper';
import relayScreen from '#helpers/relayScreen';
import { useProfileInfos } from '#hooks/authStateHooks';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import ContactCardEditForm from '#screens/ContactCardEditScreen/ContactCardEditForm';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import LoadingView from '#ui/LoadingView';
import PressableNative from '#ui/PressableNative';
import SafeAreaView from '#ui/SafeAreaView';
import Select from '#ui/Select';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import { multiUserDetailsSchema } from './MultiUserDetailsSchema';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactCardEditFormFragment_profile$key } from '#relayArtifacts/ContactCardEditFormFragment_profile.graphql';
import type { MultiUserDetailsScreen_RemoveUserMutation } from '#relayArtifacts/MultiUserDetailsScreen_RemoveUserMutation.graphql';
import type { MultiUserDetailsScreen_UpdateProfileMutation } from '#relayArtifacts/MultiUserDetailsScreen_UpdateProfileMutation.graphql';
import type { MultiUserDetailsScreenQuery } from '#relayArtifacts/MultiUserDetailsScreenQuery.graphql';
import type { ProfileRole } from '#relayArtifacts/MultiUserScreenQuery.graphql';
import type { MultiUserDetailRoute } from '#routes';
import type { ContactCardFormValues } from '#screens/ContactCardEditScreen/ContactCardSchema';
import type { CountryCode } from 'libphonenumber-js';
import type { Control } from 'react-hook-form';
import type { z } from 'zod';

export type MultiUserDetailFormValues = z.infer<typeof multiUserDetailsSchema>;

const MultiUserDetailsScreen = ({
  preloadedQuery,
}: RelayScreenProps<MultiUserDetailRoute, MultiUserDetailsScreenQuery>) => {
  const profileInfos = useProfileInfos();
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);

  const { node } = usePreloadedQuery(
    multiUserDetailsScreenQuery,
    preloadedQuery,
  );

  const profile = node?.profile;

  const {
    contactCard,
    logo,
    avatar,
    webCard,
    id: profileId,
  } = useFragment(
    contactCardFormFragment,
    profile as ContactCardEditFormFragment_profile$key,
  );
  const defaultValues = useMemo(() => {
    const phoneNumber =
      profile?.user?.phoneNumber && parsePhoneNumber(profile.user.phoneNumber);

    return {
      role: profile?.profileRole,
      firstName: contactCard?.firstName,
      lastName: contactCard?.lastName,
      //use .slice to tricks the readOnly coming from relay type.(using hard cast 'as' make it hard to read the code)
      phoneNumbers:
        contactCard?.phoneNumbers?.map(parseContactCardPhoneNumber) ?? [],
      emails: contactCard?.emails?.slice() ?? [],
      title: contactCard?.title,
      company: contactCard?.company ?? undefined,
      urls: contactCard?.urls?.slice() ?? [],
      birthday: contactCard?.birthday,
      socials: contactCard?.socials?.slice() ?? [],
      addresses: contactCard?.addresses?.slice() ?? [],
      avatar,
      selectedContact: profile?.user?.email
        ? {
            countryCodeOrEmail: 'email' as const,
            value: profile.user.email,
          }
        : phoneNumber && phoneNumber?.isValid()
          ? {
              countryCodeOrEmail: phoneNumber.country,
              value: phoneNumber.formatInternational()!,
            }
          : null,
      logo: webCard?.logo || logo,
    };
  }, [
    avatar,
    contactCard,
    logo,
    profile?.profileRole,
    profile?.user?.email,
    profile?.user?.phoneNumber,
    webCard?.logo,
  ]);

  const {
    control,
    watch,
    handleSubmit,
    formState: { dirtyFields, isSubmitting },
    reset,
  } = useForm<MultiUserDetailFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(multiUserDetailsSchema),
    shouldFocusError: true,
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const [commit, saving] =
    useMutation<MultiUserDetailsScreen_UpdateProfileMutation>(graphql`
      mutation MultiUserDetailsScreen_UpdateProfileMutation(
        $profileId: ID!
        $input: UpdateProfileInput!
        $pixelRatio: Float!
      ) {
        updateProfile(profileId: $profileId, input: $input) {
          profile {
            ...ContactCardEditFormFragment_profile
              @arguments(pixelRatio: $pixelRatio)
            profileRole
          }
        }
      }
    `);

  const submit = handleSubmit(
    async data => {
      if (profile == null) return;
      const { avatar, logo, role, selectedContact, ...contactCard } = data;

      const input = {};

      const uploads = [];

      if (avatar?.local && avatar.uri) {
        const fileName = getFileName(avatar.uri);
        const compressedFileUri = await ImageCompressor.compress(avatar.uri);
        const file: any = {
          name: fileName,
          uri: compressedFileUri,
          type: mime.lookup(fileName) || 'image/jpeg',
        };

        const { uploadURL, uploadParameters } = await uploadSign({
          kind: 'image',
          target: 'avatar',
        });
        uploads.push(uploadMedia(file, uploadURL, uploadParameters));
      } else {
        uploads.push(null);
      }

      if (logo?.local && logo.uri) {
        const fileName = getFileName(logo.uri);
        const mimeType = mime.lookup(fileName);
        const compressedFileUri = await ImageCompressor.compress(logo.uri, {
          output: mimeType === 'image/jpeg' ? 'jpg' : 'png',
        });
        const file: any = {
          name: fileName,
          uri: compressedFileUri,
          type: mimeType === 'image/jpeg' ? mimeType : 'image/png',
        };

        const { uploadURL, uploadParameters } = await uploadSign({
          kind: 'image',
          target: 'logo',
        });
        uploads.push(uploadMedia(file, uploadURL, uploadParameters));
      } else {
        uploads.push(null);
      }

      const [uploadedAvatarId, uploadedLogoId] = await Promise.all(
        uploads.map(upload =>
          upload?.promise.then(({ public_id }) => {
            return public_id;
          }),
        ),
      );

      const avatarId =
        avatar === null ? null : avatar?.local ? uploadedAvatarId : avatar?.id;
      const logoId =
        logo === null ? null : logo?.local ? uploadedLogoId : logo?.id;

      if (avatar?.local && avatar && avatar?.uri) {
        addLocalCachedMediaFile(avatarId, 'image', avatar.uri);
      }
      if (logo?.local && logoId && logo?.uri) {
        addLocalCachedMediaFile(logoId, 'image', logo.uri);
      }

      if (dirtyFields.role) Object.assign(input, { profileRole: role });

      commit({
        variables: {
          profileId,
          input: {
            ...input,
            contactCard: {
              ...contactCard,
              phoneNumbers: contactCard.phoneNumbers
                ?.filter(phoneNumber => phoneNumber.number)
                .map(({ countryCode, ...phoneNumber }) => {
                  const number = getPhonenumberWithCountryCode(
                    phoneNumber.number,
                    countryCode as CountryCode,
                  );
                  return { ...phoneNumber, number };
                }),
              avatarId,
              logoId,
            },
          },
          pixelRatio: CappedPixelRatio(),
        },
        onCompleted: () => {
          router.back();
        },
        onError: e => {
          console.error(e);

          if (e.message === ERRORS.PROFILE_DONT_EXISTS) {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage: 'Error, user declined the invitation.',
                description:
                  'Error toast message when updating user who declined the invitation from MultiUserDetailModal',
              }),
              onHide: () => {
                router.back();
              },
            });
          } else {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage:
                  'Error, could not update user. Please try again.',
                description:
                  'Error toast message when updating user from MultiUserDetailModal',
              }),
            });
          }
        },
      });
    },
    error => {
      console.error(error);
    },
  );

  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const role = watch('role');

  const isCurrentProfile = profileId === profileInfos?.profileId;

  const [commitDelete, deletionIsActive] =
    useMutation<MultiUserDetailsScreen_RemoveUserMutation>(graphql`
      mutation MultiUserDetailsScreen_RemoveUserMutation(
        $webCardId: ID!
        $input: [ID!]!
      ) {
        removeUsersFromWebCard(webCardId: $webCardId, removedProfileIds: $input)
      }
    `);

  const router = useRouter();

  useEffect(() => {
    if (!node) {
      router.back();
    }
  }, [node, router]);

  const onRemoveUser = useCallback(() => {
    if (webCard?.id == null) return;
    commitDelete({
      variables: {
        webCardId: webCard.id,
        input: [profileId],
      },
      onCompleted: () => {
        Toast.show({
          type: 'success',
          text1: intl.formatMessage({
            defaultMessage: 'User removed successfully.',
            description:
              'Success toast message when removing user from MultiUserDetailModal',
          }),
        });
        router.back();
      },
      onError: e => {
        console.error(e);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Error, could not remove user. Please try again.',
            description:
              'Error toast message when removing user from MultiUserDetailModal',
          }),
        });
      },
      updater: (store, response) => {
        if (!response?.removeUsersFromWebCard?.includes(profileId)) {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error, could not remove user. Please try again.',
              description:
                'Error toast message when removing user from MultiUserDetailModal',
            }),
          });
          return;
        }

        if (webCard) {
          const webCardRecord = store.get(webCard.id);
          if (webCardRecord) {
            const connection = ConnectionHandler.getConnection(
              webCardRecord,
              'MultiUserScreenUserList_webCard_connection_profiles',
            );
            if (connection) {
              ConnectionHandler.deleteNode(connection, profileId);
            }
            //update the user counter profile?.webCard?.nbProfiles
            const nbProfiles = webCardRecord?.getValue('nbProfiles') as number;
            webCardRecord?.setValue(nbProfiles - 1, 'nbProfiles');
          }
        }
      },
    });
  }, [commitDelete, intl, profileId, router, webCard]);

  const onConfirmRemoveUser = useCallback(() => {
    Alert.alert(
      intl.formatMessage({
        defaultMessage: 'Removed user will loose access to this WebCard.',
        description: 'Remove user from multi-user confirm title',
      }),
      intl.formatMessage({
        defaultMessage:
          'This action is irreversible, but you can always invite this user again.',
        description: 'Remove user from multi-user confirm subtitle',
      }),
      [
        {
          text: intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Remove user from multi-user cancel button label',
          }),
          style: 'cancel',
        },
        {
          text: intl.formatMessage({
            defaultMessage: 'Confirm',
            description: 'Remove user from multi-user confirm button label',
          }),
          onPress: onRemoveUser,
          style: 'destructive',
        },
      ],
    );
  }, [intl, onRemoveUser]);

  const colorScheme = useColorScheme();
  const { width: windowWidth } = useWindowDimensions();

  const chartData = useMemo(() => {
    if (!profile?.statsSummary) {
      return [];
    }
    const result = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - 29 + i); // Adjust the date to get the last 30 days
      const utcDate = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      );

      return {
        day: utcDate.toISOString(),
        data: 0,
      };
    });
    profile.statsSummary?.forEach(stats => {
      if (stats) {
        const index = result.findIndex(item => item.day === stats.day);
        if (index !== -1) {
          result[index].data = stats.contactCardScans ?? 0;
        }
      }
    });
    return normalizeArray(result.map(item => item.data));
  }, [profile?.statsSummary]);

  if (!profileInfos?.profileId || profile == null) return null;

  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          leftElement={
            <Button
              variant="secondary"
              label={intl.formatMessage({
                defaultMessage: 'Cancel',
                description: 'MultiUserDetailModal - Cancel button label',
              })}
              onPress={router.back}
            />
          }
          middleElement={
            <Text variant="large" style={styles.name}>
              ~{firstName} {lastName}
            </Text>
          }
          rightElement={
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Save',
                description: 'MultiUserAddModal - Save button label',
              })}
              loading={saving || isSubmitting}
              onPress={submit}
            />
          }
        />
        <ContactCardEditForm
          webCard={webCard}
          control={control as unknown as Control<ContactCardFormValues>}
          footer={
            !isCurrentProfile &&
            role !== 'owner' && (
              <PressableNative
                style={styles.removeButton}
                onPress={onConfirmRemoveUser}
                disabled={deletionIsActive}
              >
                <Text variant="button" style={styles.removeText}>
                  <FormattedMessage
                    defaultMessage="Remove user"
                    description="label for button to remove user from multi-user profile"
                  />
                </Text>
              </PressableNative>
            )
          }
        >
          <View style={styles.contentPaddingHorizontal}>
            <Controller
              control={control}
              name="selectedContact"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text variant="xsmall" style={styles.title}>
                    <FormattedMessage
                      defaultMessage="Email address or phone number"
                      description="MultiUserDetailModal - label for contact"
                    />
                  </Text>
                  <TextInput
                    value={value?.value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    style={[styles.input, styles.contactText]}
                    editable={false}
                  />
                </View>
              )}
            />
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <Text variant="xsmall" style={styles.title}>
                    <FormattedMessage
                      defaultMessage="Role"
                      description="MultiUserDetailModal - label for role"
                    />
                  </Text>
                  <Select
                    nativeID="role"
                    disabled={isCurrentProfile || role === 'owner'}
                    accessibilityLabelledBy="roleLabel"
                    data={
                      role === 'owner'
                        ? [
                            {
                              id: 'owner',
                              label: (
                                <FormattedMessage
                                  defaultMessage="Owner"
                                  description="MultiUserDetailModal - Label for owner select input"
                                />
                              ),
                            },
                          ]
                        : roles
                    }
                    selectedItemKey={value}
                    keyExtractor={keyExtractor}
                    onItemSelected={item => onChange(item.id)}
                    itemContainerStyle={styles.selectItemContainerStyle}
                    bottomSheetTitle={
                      intl.formatMessage({
                        defaultMessage: 'Select a role',
                        description:
                          'MultiUserDetailForm - Role BottomSheet - Title',
                      }) as string
                    }
                    useFlatList={false}
                  />
                </View>
              )}
            />

            {!profile.webCard?.profilePendingOwner && (
              <Text variant="xsmall" style={styles.description}>
                {role === 'user' && (
                  <FormattedMessage
                    defaultMessage="A 'user' can edit and use the ContactCard linked to the shared WebCard{azzappA}. However, a 'user' has a view-only access to the WebCard{azzappA} itself and to the posts, and 'user' cannot 'like', 'comment', or 'follow' on the posts and WebCards{azzappA} of others."
                    description="MultiUserDetailModal - User description"
                    values={{
                      azzappA: <Text variant="azzapp">a</Text>,
                    }}
                  />
                )}
                {role === 'editor' && (
                  <FormattedMessage
                    defaultMessage="An 'editor' can publish posts, edit WebCard{azzappA} contents, and interact with WebCards{azzappA} and posts of others. However, 'editor' does not have access to WebCard{azzappA} parameters and to the Multi-User settings."
                    description="MultiUserDetailModal - Editor description"
                    values={{
                      azzappA: <Text variant="azzapp">a</Text>,
                    }}
                  />
                )}
                {role === 'admin' && (
                  <FormattedMessage
                    defaultMessage="An 'admin' has a full control over the shared WebCard{azzappA}, including the ability to publish and unpublish it, to change the WebCard{azzappA} name, and to manage Multi-User collaborators. Also, ‘admin’ can manage payment details. However, an 'admin' cannot deactivate the Multi-User mode or delete the WebCard{azzappA}."
                    description="MultiUserDetailModal - admin description"
                    values={{
                      azzappA: <Text variant="azzapp">a</Text>,
                    }}
                  />
                )}
                {role === 'owner' && (
                  <FormattedMessage
                    defaultMessage="The 'owner' has a full control of the WebCard{azzappA}, including ability to deactivate the Multi-User mode, to transfer WebCard{azzappA} ownership, and to delete the WebCard{azzappA}. Also, ‘owner’ can manage payment details."
                    description="MultiUserDetailModal - admin description"
                    values={{
                      azzappA: <Text variant="azzapp">a</Text>,
                    }}
                  />
                )}
              </Text>
            )}
            {profile.webCard?.profilePendingOwner && (
              <Text variant="xsmall" style={styles.description}>
                <FormattedMessage
                  defaultMessage="An ownership request has been sent. Ownership will be transfered as soon as the request is accepted."
                  description="MultiUserDetailModal - Description for pending ownership transfer"
                />
              </Text>
            )}
            <View style={styles.stats}>
              <ProfileStatisticsChart
                width={
                  windowWidth -
                  styles.contentPaddingHorizontal.paddingHorizontal * 2 -
                  styles.stats.paddingHorizontal * 2
                }
                height={170}
                data={chartData}
                variant={colorScheme ?? 'dark'}
              />
              <View style={styles.statsLabelContainer}>
                <Text variant="xlarge" style={styles.statsLabel}>
                  {profile.nbContactCardScans}
                </Text>
                <Text variant="smallbold" style={styles.statsLabel}>
                  <FormattedMessage
                    defaultMessage="Contact card{azzappA} views"
                    description="Multi users statistics - Contact card views label"
                    values={{
                      azzappA: <Text variant="azzapp">a</Text>,
                    }}
                  />
                </Text>
              </View>
            </View>
          </View>
        </ContactCardEditForm>
      </SafeAreaView>
      {isSubmitting || saving ? (
        /* Used to prevent user from interacting with the screen while saving */
        <View style={StyleSheet.absoluteFill} />
      ) : null}
    </Container>
  );
};

const roles: Array<{ id: ProfileRole; label: ReactNode }> = [
  {
    id: 'user',
    label: (
      <FormattedMessage
        defaultMessage="User"
        description="MultiUserDetailModal - Label for user select input"
      />
    ),
  },
  {
    id: 'editor',
    label: (
      <FormattedMessage
        defaultMessage="Editor"
        description="MultiUserDetailModal - Label for editor select input"
      />
    ),
  },
  {
    id: 'admin',
    label: (
      <FormattedMessage
        defaultMessage="Admin"
        description="MultiUserDetailModal - Label for admin select input"
      />
    ),
  },
];

const styleSheet = createStyleSheet(appearance => ({
  removeButton: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  removeText: {
    color: colors.red400,
    paddingBottom: 15,
  },
  field: {
    marginTop: 10,
  },
  input: {},
  title: {
    color: colors.grey900,
    paddingBottom: 10,
  },
  selectItemContainerStyle: {
    paddingHorizontal: 30,
    marginBottom: 18,
  },
  contactText: {
    backgroundColor: 'transparent',
    color: colors.grey600,
  },
  description: {
    paddingHorizontal: 50,
    textAlign: 'center',
    marginTop: 20,
    color: appearance === 'light' ? colors.grey900 : colors.grey300,
  },
  stats: {
    marginBottom: 50,
    flex: 1,
    justifyContent: 'center',
    overflow: 'visible',
    paddingHorizontal: 10,
    gap: 5,
  },
  statsLabelContainer: {
    rowGap: 10,
    alignItems: 'center',
  },
  statsLabel: {
    textAlign: 'center',
  },
  name: {
    maxWidth: '50%',
    textAlign: 'center',
  },
  transfer: {
    marginTop: 20,
  },
  pending: {
    color: colors.green,
    textAlign: 'center',
    marginTop: 20,
  },
  pendingEmail: {
    marginTop: 20,
    textAlign: 'center',
  },
  cancel: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
  cancelButton: {
    width: 136,
  },
  contentPaddingHorizontal: {
    paddingHorizontal: 10,
  },
}));

const MultiUserDetailsScreenFallback = () => {
  const router = useRouter();
  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header leftElement={<CancelHeaderButton onPress={router.back} />} />
        <View style={{ aspectRatio: 1, backgroundColor: colors.grey100 }} />
        <LoadingView />
      </SafeAreaView>
    </Container>
  );
};

const multiUserDetailsScreenQuery = graphql`
  query MultiUserDetailsScreenQuery($profileId: ID!, $pixelRatio: Float!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        profileRole
        promotedAsOwner
        user {
          email
          phoneNumber
        }
        webCard {
          profilePendingOwner {
            id
            user {
              email
              phoneNumber
            }
          }
        }
        nbContactCardScans
        statsSummary {
          day
          contactCardScans
        }
        ...ContactCardEditFormFragment_profile
          @arguments(pixelRatio: $pixelRatio)
      }
    }
  }
`;

const multiUserDetailModal = relayScreen(MultiUserDetailsScreen, {
  query: multiUserDetailsScreenQuery,
  getVariables: ({ profileId }) => ({
    profileId,
    pixelRatio: CappedPixelRatio(),
  }),
  fallback: MultiUserDetailsScreenFallback,
});

multiUserDetailModal.getScreenOptions = (): ScreenOptions => ({
  stackAnimation: 'slide_from_bottom',
});

export default multiUserDetailModal;
