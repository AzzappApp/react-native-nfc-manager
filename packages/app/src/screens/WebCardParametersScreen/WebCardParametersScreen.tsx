import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ActivityIndicator, Alert, View } from 'react-native';
import Toast from 'react-native-toast-message';
import {
  graphql,
  useFragment,
  useMutation,
  usePreloadedQuery,
} from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { profileIsOwner } from '@azzapp/shared/profileHelpers';
import { isWebCardKindSubscription } from '@azzapp/shared/subscriptionHelpers';
import { colors, textStyles } from '#theme';
import { useRouter } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { keyExtractor } from '#helpers/idHelpers';
import relayScreen from '#helpers/relayScreen';
import useQuitWebCard from '#hooks/useQuitWebCard';
import useToggle from '#hooks/useToggle';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import SafeAreaView from '#ui/SafeAreaView';
import Select from '#ui/Select';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import WebcardParametersCompanyActivityLabelForm from './WebCardParametersCompanyActivityLabelForm';
import WebcardParametersCompanyNameForm from './WebCardParametersCompanyNameForm';
import WebcardParametersFirstNameForm from './WebCardParametersFirstNameForm';
import WebCardParametersHeader from './WebCardParametersHeader';
import WebcardParametersLastNameForm from './WebCardParametersLastNameForm';
import WebCardParametersNameForm from './WebCardParametersNameForm';
import WebCardParametersScreenFallback from './WebCardParametersScreenFallback';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { WebCardParametersScreen_webCard$key } from '#relayArtifacts/WebCardParametersScreen_webCard.graphql';
import type { WebCardParametersScreenMutation } from '#relayArtifacts/WebCardParametersScreenMutation.graphql';
import type {
  WebCardParametersScreenQuery,
  WebCardParametersScreenQuery$data,
} from '#relayArtifacts/WebCardParametersScreenQuery.graphql';
import type { WebCardParametersScreenUnPublishMutation } from '#relayArtifacts/WebCardParametersScreenUnPublishMutation.graphql';
import type { WebCardParametersRoute } from '#routes';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { GraphQLError } from 'graphql';

const webCardParametersScreenQuery = graphql`
  query WebCardParametersScreenQuery($webCardId: ID!, $profileId: ID!) {
    webCard: node(id: $webCardId) {
      ...WebCardParametersScreen_webCard
      ... on WebCard {
        isPremium
      }
    }
    profile: node(id: $profileId) {
      ... on Profile {
        profileRole
      }
    }
    webCardCategories {
      id
      label
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
    webCardParameters {
      userNameChangeFrequencyDay
    }
  }
`;

const WebCardParametersScreen = ({
  preloadedQuery,
}: RelayScreenProps<WebCardParametersRoute, WebCardParametersScreenQuery>) => {
  const {
    webCard: webCardKey,
    profile,
    webCardCategories,
    webCardParameters: { userNameChangeFrequencyDay },
  } = usePreloadedQuery(webCardParametersScreenQuery, preloadedQuery);
  const router = useRouter();

  const isWebCardOwner = useMemo(() => {
    return profileIsOwner(profile?.profileRole);
  }, [profile]);

  const webCard = useFragment(
    graphql`
      fragment WebCardParametersScreen_webCard on WebCard {
        id
        userName
        cardIsPublished
        webCardKind
        alreadyPublished
        lastUserNameUpdate
        nextChangeUsernameAllowedAt
        webCardCategory {
          id
        }
        companyActivityLabel
        hasCover
        requiresSubscription
        isPremium
        firstName
        lastName
        companyName
        ...AccountHeader_webCard
      }
    `,
    webCardKey as WebCardParametersScreen_webCard$key | null,
  );

  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);
  const [userNameFormVisible, toggleUserNameFormVisible] = useToggle(false);
  const [firstNameFormVisible, toggleFirstNameFormVisible] = useToggle(false);
  const [lastNameFormVisible, toggleLastNameFormVisible] = useToggle(false);
  const [companyNameFormVisible, toggleCompanyNameFormVisible] =
    useToggle(false);
  const [companyActivityFormVisible, toggleCompanyActivityFormVisible] =
    useToggle(false);

  const [commitToggleWebCardPublished] =
    useMutation<WebCardParametersScreenUnPublishMutation>(graphql`
      mutation WebCardParametersScreenUnPublishMutation(
        $webCardId: ID!
        $input: ToggleWebCardPublishedInput!
      ) {
        toggleWebCardPublished(webCardId: $webCardId, input: $input) {
          webCard {
            id
            cardIsPublished
            alreadyPublished
          }
        }
      }
    `);

  const onChangeIsPublished = useCallback(
    (published: boolean) => {
      if (!webCard) {
        return;
      }

      if (published && webCard.requiresSubscription && !webCard.isPremium) {
        router.push({ route: 'USER_PAY_WALL' });
        return;
      }
      commitToggleWebCardPublished({
        variables: {
          webCardId: webCard.id,
          input: {
            published,
          },
        },
        optimisticResponse: {
          toggleWebCardPublished: {
            webCard: {
              id: webCard?.id,
              cardIsPublished: published,
              alreadyPublished: webCard?.alreadyPublished,
            },
          },
        },
        onError: error => {
          console.log(error);

          Toast.show({
            type: 'error',
            text1: intl.formatMessage(
              {
                defaultMessage:
                  'Oops, the WebCard{azzappA} could not be updated.',
                description: 'Error toast message when saving webCard failed',
              },
              {
                azzappA: <Text variant="azzapp">a</Text>,
              },
            ) as unknown as string,
          });
        },
      });
    },
    [commitToggleWebCardPublished, intl, router, webCard],
  );

  const [commitUpdateWebCard] = useMutation<WebCardParametersScreenMutation>(
    graphql`
      mutation WebCardParametersScreenMutation(
        $webCardId: ID!
        $input: UpdateWebCardInput!
      ) {
        updateWebCard(webCardId: $webCardId, input: $input) {
          webCard {
            id
            webCardKind
            lastUserNameUpdate
            webCardCategory {
              id
            }
            companyActivityLabel
            requiresSubscription
          }
        }
      }
    `,
  );

  const [quitWebCard, isLoadingQuitWebCard] = useQuitWebCard(
    webCard?.id ?? '',
    router.back,
    e => {
      if (e.message === ERRORS.SUBSCRIPTION_IS_ACTIVE) {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              "You have an active subscription on this WebCard. You can't delete it.",
            description:
              'Error toast message when quitting WebCard with an active subscription',
          }),
        });
      } else {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage(
            {
              defaultMessage:
                'Oops, quitting this WebCard{azzappA} was not possible. Please try again later.',
              description: 'Error toast message when quitting WebCard',
            },
            {
              azzappA: <Text variant="azzapp">a</Text>,
            },
          ) as unknown as string,
        });
      }
    },
  );

  const updateWebCardCategory = useCallback(
    (webCardCategory: WebCardCategory) => {
      if (!webCard) {
        return;
      }
      commitUpdateWebCard({
        variables: {
          webCardId: webCard.id,
          input: {
            webCardCategoryId: webCardCategory.id,
          },
        },
        onError: error => {
          console.log(error);

          const response = (
            'response' in error ? error.response : undefined
          ) as { errors: GraphQLError[] } | undefined;
          if (
            response?.errors.some(
              r =>
                r.message === ERRORS.SUBSCRIPTION_REQUIRED ||
                r.message === ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS,
            )
          ) {
            router.push({ route: 'USER_PAY_WALL' });
            return;
          } else {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage(
                {
                  defaultMessage:
                    'Oops, the WebCard{azzappA} could not be updated.',
                  description: 'Error toast message when saving webCard failed',
                },
                {
                  azzappA: <Text variant="azzapp">a</Text>,
                },
              ) as unknown as string,
            });
          }
        },
      });
    },
    [commitUpdateWebCard, intl, router, webCard],
  );

  const canChangeUserName = useMemo(() => {
    if (!webCard || webCard?.alreadyPublished === false) {
      return true;
    }
    // Get the current date and time
    const now = new Date();
    if (
      webCard?.nextChangeUsernameAllowedAt &&
      new Date(webCard?.nextChangeUsernameAllowedAt) < now
    ) {
      return true;
    } else {
      return false;
    }
  }, [webCard]);

  const onPressUserName = useCallback(() => {
    if (canChangeUserName) {
      toggleUserNameFormVisible();
    } else {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage(
          {
            defaultMessage:
              'You will be able to change your WebCard{azzappA} name',
            description:
              'WebCardParameters Screen : Toast Error message when not authorize to change the WebCard name',
          },
          {
            azzappA: <Text variant="azzapp">a</Text>,
          },
        ) as unknown as string,
        text2: intl.formatMessage(
          {
            defaultMessage: 'The {dateChange} at {timeChange}',
            description:
              'WebCardParameters Screen : Toast Error message when not authorize to change the WebCard name',
          },
          {
            dateChange: webCard?.nextChangeUsernameAllowedAt
              ? intl.formatDate(webCard?.nextChangeUsernameAllowedAt)
              : 'unknown date',
            timeChange: webCard?.nextChangeUsernameAllowedAt
              ? intl.formatTime(webCard?.nextChangeUsernameAllowedAt)
              : 'unknown date',
          },
        ),
        visibilityTime: 5000,
      });
    }
  }, [
    canChangeUserName,
    intl,
    toggleUserNameFormVisible,
    webCard?.nextChangeUsernameAllowedAt,
  ]);

  const handleConfirmationQuitWebCard = useCallback(() => {
    const titleMsg = isWebCardOwner
      ? intl.formatMessage({
          defaultMessage: 'Delete this WebCard',
          description: 'Delete WebCard title',
        })
      : intl.formatMessage({
          defaultMessage: 'Quit this WebCard',
          description: 'Quit WebCard title',
        });

    const descriptionMsg = isWebCardOwner
      ? intl.formatMessage({
          defaultMessage:
            'Are you sure you want to delete this WebCard and all its contents? This action is irreversible.',
          description: 'Delete WebCard confirmation message',
        })
      : intl.formatMessage({
          defaultMessage:
            'Are you sure you want to quit this WebCard? This action is irreversible.',
          description: 'Quit WebCard confirmation message',
        });

    const labelConfirmation = isWebCardOwner
      ? intl.formatMessage({
          defaultMessage: 'Delete this WebCard',
          description: 'Delete button label',
        })
      : intl.formatMessage({
          defaultMessage: 'Quit this WebCard',
          description: 'Quit button label',
        });
    Alert.alert(titleMsg, descriptionMsg, [
      {
        text: intl.formatMessage({
          defaultMessage: 'Cancel',
          description: 'Cancel button label',
        }),
        style: 'cancel',
      },
      {
        text: labelConfirmation,
        style: 'destructive',
        onPress: quitWebCard,
      },
    ]);
  }, [intl, isWebCardOwner, quitWebCard]);

  if (!webCard) {
    return null;
  }

  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <View style={styles.content}>
          <WebCardParametersHeader webCard={webCard ?? null} />
          <Icon icon="parameters" style={styles.warningIcon} />
          <View style={styles.modalLine}>
            <View style={[styles.publishTitle, styles.proContainer]}>
              <Text variant="medium">
                <FormattedMessage
                  defaultMessage="Publish"
                  description="WebCard parameters Modal - Likes switch Label"
                />
              </Text>
              <PremiumIndicator
                isRequired={webCard.requiresSubscription && !webCard.isPremium}
              />
            </View>
            <Switch
              variant="large"
              value={webCard?.cardIsPublished}
              onValueChange={onChangeIsPublished}
              disabled={!webCard?.hasCover}
            />
          </View>
          <View style={styles.section}>
            <Text variant="xsmall" style={styles.sectionTitle}>
              <FormattedMessage
                defaultMessage="NAME"
                description="Title of the section where user can change their webcard name"
              />
            </Text>
          </View>
          <PressableNative
            style={styles.sectionField}
            onPress={onPressUserName}
          >
            <Text variant="smallbold">
              <FormattedMessage
                defaultMessage="WebCard{azzappA} name"
                description="UserName field in the webcard parameters screen"
                values={{
                  azzappA: <Text variant="azzapp">a</Text>,
                }}
              />
            </Text>
            <Text variant="medium">{webCard.userName}</Text>
          </PressableNative>
          <Text variant="xsmall" style={styles.descriptionText}>
            <FormattedMessage
              defaultMessage="You can only change your WebCard{azzappA} name every {dayInterval} days."
              description="Description message for userName field in webcard parameters"
              values={{
                dayInterval: userNameChangeFrequencyDay,
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          </Text>
          <View style={styles.section}>
            <Text variant="xsmall" style={styles.sectionTitle}>
              <FormattedMessage
                defaultMessage="CATEGORY & ACTIVITY"
                description="Title of the section where user can view their category and activity"
              />
            </Text>
          </View>

          <View style={styles.sectionField}>
            <Text variant="smallbold">
              <FormattedMessage
                defaultMessage="WebCard{azzappA} category"
                description="category field in the webcard parameters screen"
                values={{
                  azzappA: <Text variant="azzapp">a</Text>,
                }}
              />
            </Text>
            <Select
              nativeID="profileCategories"
              accessibilityLabelledBy="profileCategoriesLabel"
              data={webCardCategories ?? []}
              selectedItemKey={webCard.webCardCategory?.id}
              keyExtractor={keyExtractor}
              useFlatList={false}
              onItemSelected={updateWebCardCategory}
              bottomSheetTitle={
                intl.formatMessage({
                  defaultMessage: 'Select a category',
                  description:
                    'WebCardParameters screen - Profile Categoriy BottomSheet - Title',
                }) as string
              }
              style={{
                backgroundColor: 'transparent',
                borderWidth: 0,
                paddingRight: 0,
              }}
              itemContainerStyle={styles.selectItemContainerStyle}
              renderItem={({ item }) => (
                <View style={styles.selectItem}>
                  <Text variant="button">{item.label}</Text>
                  <PremiumIndicator
                    size={24}
                    isRequired={
                      isWebCardKindSubscription(item.webCardKind) &&
                      !webCard.isPremium
                    }
                  />
                </View>
              )}
            />
          </View>
          {webCard.webCardKind === 'personal' && (
            <PressableNative
              style={styles.sectionField}
              onPress={toggleFirstNameFormVisible}
            >
              <Text variant="smallbold">
                <FormattedMessage
                  defaultMessage="Firstname"
                  description="firstname field in the webcard parameters screen"
                />
              </Text>
              <Text variant="medium">{webCard.firstName}</Text>
            </PressableNative>
          )}
          {webCard.webCardKind === 'personal' && (
            <PressableNative
              style={styles.sectionField}
              onPress={toggleLastNameFormVisible}
            >
              <Text variant="smallbold">
                <FormattedMessage
                  defaultMessage="Lastname"
                  description="lastname field in the webcard parameters screen"
                />
              </Text>
              <Text variant="medium">{webCard.lastName}</Text>
            </PressableNative>
          )}
          {webCard.webCardKind !== 'personal' && (
            <PressableNative
              style={styles.sectionField}
              onPress={toggleCompanyActivityFormVisible}
            >
              <Text variant="smallbold">
                <FormattedMessage
                  defaultMessage="Activity"
                  description="Activity field in the webcard parameters screen"
                />
              </Text>
              <Text variant="medium">{webCard.companyActivityLabel} </Text>
            </PressableNative>
          )}
          {webCard.webCardKind !== 'personal' && (
            <PressableNative
              style={styles.sectionField}
              onPress={toggleCompanyNameFormVisible}
            >
              <Text variant="smallbold">
                <FormattedMessage
                  defaultMessage="Company name"
                  description="company name field in the webcard parameters screen"
                />
              </Text>
              <Text variant="medium">{webCard.companyName}</Text>
            </PressableNative>
          )}

          <Text variant="xsmall" style={styles.descriptionText}>
            <FormattedMessage
              defaultMessage="Changing the WebCard{azzappA} category will not impact your current WebCard{azzappA}, but it will change what suggested photos and videos you are offered for your WebCard{azzappA} Cover."
              description="Description message for category and activity field in webcard parameters"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          </Text>
          <PressableNative
            onPress={handleConfirmationQuitWebCard}
            style={styles.deleteOptionButton}
            disabled={isLoadingQuitWebCard}
          >
            {isLoadingQuitWebCard ? (
              <ActivityIndicator color={colors.red400} />
            ) : (
              <Text variant="error" style={textStyles.button}>
                {isWebCardOwner ? (
                  <FormattedMessage
                    defaultMessage="Delete this WebCard{azzappA}"
                    description="label for button to delete a webcard"
                    values={{
                      azzappA: (
                        <Text variant="azzapp" style={styles.deleteButton}>
                          a
                        </Text>
                      ),
                    }}
                  />
                ) : (
                  <FormattedMessage
                    defaultMessage="Quit this WebCard{azzappA}"
                    description="Quit WebCard title"
                    values={{
                      azzappA: (
                        <Text variant="azzapp" style={styles.deleteButton}>
                          a
                        </Text>
                      ),
                    }}
                  />
                )}
              </Text>
            )}
          </PressableNative>
        </View>
        {webCard && (
          <>
            <WebCardParametersNameForm
              webCard={webCard}
              visible={userNameFormVisible}
              toggleBottomSheet={toggleUserNameFormVisible}
            />
            <WebcardParametersFirstNameForm
              webCard={webCard}
              visible={firstNameFormVisible}
              toggleBottomSheet={toggleFirstNameFormVisible}
            />
            <WebcardParametersLastNameForm
              webCard={webCard}
              visible={lastNameFormVisible}
              toggleBottomSheet={toggleLastNameFormVisible}
            />
            <WebcardParametersCompanyNameForm
              webCard={webCard}
              visible={companyNameFormVisible}
              toggleBottomSheet={toggleCompanyNameFormVisible}
            />
            <WebcardParametersCompanyActivityLabelForm
              webCard={webCard}
              visible={companyActivityFormVisible}
              toggleBottomSheet={toggleCompanyActivityFormVisible}
            />
          </>
        )}
      </SafeAreaView>
    </Container>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  warningIcon: { width: 50, height: 50, alignSelf: 'center' },
  content: { rowGap: 15, paddingHorizontal: 10 },
  section: {
    backgroundColor: appearance === 'light' ? colors.grey100 : colors.grey800,
    height: 28,
    borderRadius: 12,
    justifyContent: 'center',
  },
  sectionTitle: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  publishTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  sectionField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 32,
    alignItems: 'center',
  },
  modalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 32,
  },
  descriptionText: { color: colors.grey400 },
  selectItemContainerStyle: {
    marginBottom: 18,
    paddingHorizontal: 30,
  },
  searchContainer: { paddingBottom: 20 },
  deleteOptionButton: {
    height: 32,
    marginVertical: 10,
    alignSelf: 'center',
    justifyContent: 'center',
    fontWeight: 600,
  },
  deleteButton: { color: colors.red400 },
  proContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectItem: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));

export default relayScreen(WebCardParametersScreen, {
  query: webCardParametersScreenQuery,
  getVariables: (_, profileInfos) => ({
    webCardId: profileInfos?.webCardId ?? '',
    profileId: profileInfos?.profileId ?? '',
  }),
  fallback: WebCardParametersScreenFallback,
  fetchPolicy: 'store-and-network',
});

type WebCardCategory = ArrayItemType<
  WebCardParametersScreenQuery$data['webCardCategories']
>;
