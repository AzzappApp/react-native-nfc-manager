import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import {
  graphql,
  useFragment,
  useMutation,
  usePreloadedQuery,
} from 'react-relay';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useToggle from '#hooks/useToggle';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import SafeAreaView from '#ui/SafeAreaView';
import Select from '#ui/Select';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import WebCardParametersHeader from './WebCardParametersHeader';
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

const webCardParametersScreenQuery = graphql`
  query WebCardParametersScreenQuery($webCardId: ID!) {
    webCard: node(id: $webCardId) {
      ...WebCardParametersScreen_webCard
    }
    webCardCategories {
      id
      label
      webCardKind
      companyActivities {
        id
        label
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
    webCardCategories,
    webCardParameters: { userNameChangeFrequencyDay },
  } = usePreloadedQuery(webCardParametersScreenQuery, preloadedQuery);

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
        companyActivity {
          id
        }
        cardCover {
          segmented
        }
        ...AccountHeader_webCard
      }
    `,
    webCardKey as WebCardParametersScreen_webCard$key | null,
  );

  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);
  const [userNameFormVisible, toggleUserNameFormVisible] = useToggle(false);
  const activities = useMemo(
    () =>
      webCardCategories?.find(a => a.id === webCard?.webCardCategory?.id)
        ?.companyActivities,
    [webCard?.webCardCategory?.id, webCardCategories],
  );

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
            text1: intl.formatMessage({
              defaultMessage:
                'The webCard could not be updated. Please try again.',
              description: 'Error toast message when saving webCard failed',
            }),
          });
        },
      });
    },
    [commitToggleWebCardPublished, intl, webCard],
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
            companyActivity {
              id
            }
          }
        }
      }
    `,
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
            webCardKind: webCardCategory.webCardKind,
            companyActivityId: undefined,
          },
        },
        onError: error => {
          console.log(error);

          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage:
                'The webCard could not be updated. Please try again.',
              description: 'Error toast message when saving webCard failed',
            }),
          });
        },
      });
    },
    [commitUpdateWebCard, intl, webCard],
  );

  const updateProfileActivity = useCallback(
    (activity: CompanyActivity) => {
      if (!webCard) {
        return;
      }
      commitUpdateWebCard({
        variables: {
          webCardId: webCard.id,
          input: {
            companyActivityId: activity.id,
          },
        },
        onError: () => {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage:
                'The webCard could not be updated. Please try again.',
              description: 'Error toast message when saving webCard failed',
            }),
          });
        },
      });
    },
    [commitUpdateWebCard, intl, webCard],
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
        ) as string,
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
            <Text variant="medium">
              <FormattedMessage
                defaultMessage="Publish"
                description="PostItem Modal - Likes switch Label"
              />
            </Text>
            <Switch
              variant="large"
              value={webCard?.cardIsPublished}
              onValueChange={onChangeIsPublished}
              disabled={!webCard?.cardCover}
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
              bottomSheetHeight={Math.min(
                (webCardCategories?.length ?? 0) * 50 + 80,
                300,
              )}
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
            />
          </View>
          {webCard.webCardKind !== 'personal' && (
            <View style={styles.sectionField}>
              <Text variant="smallbold">
                <FormattedMessage
                  defaultMessage="Activity"
                  description="Activity field in the webcard parameters screen"
                />
              </Text>
              <Select
                nativeID="activities"
                accessibilityLabelledBy="activitiesLabel"
                data={activities ?? []}
                selectedItemKey={webCard.companyActivity?.id}
                keyExtractor={keyExtractor}
                bottomSheetHeight={Math.min(
                  (webCardCategories?.length ?? 0) * 50 + 80,
                  400,
                )}
                onItemSelected={updateProfileActivity}
                bottomSheetTitle={intl.formatMessage({
                  defaultMessage: 'Select an activity',
                  description:
                    'WebCardParameters screen - Activity BottomSheet - Title',
                })}
                style={{
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  paddingRight: 0,
                }}
                itemContainerStyle={styles.selectItemContainerStyle}
                placeHolder={intl.formatMessage({
                  defaultMessage: 'Select an activity',
                  description:
                    'WebCardParameters screen Name Company Screen - Accessibility TextInput Placeholder Choose a company activity',
                })}
              />
            </View>
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
        </View>
        {webCard && (
          <WebCardParametersNameForm
            webCard={webCard}
            visible={userNameFormVisible}
            toggleBottomSheet={toggleUserNameFormVisible}
          />
        )}
      </SafeAreaView>
    </Container>
  );
};

const keyExtractor = (item: CompanyActivity | WebCardCategory) => item.id;

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
}));

export default relayScreen(WebCardParametersScreen, {
  query: webCardParametersScreenQuery,
  getVariables: (_, profileInfos) => ({
    webCardId: profileInfos?.webCardId ?? '',
  }),
  fallback: WebCardParametersScreenFallback,
  fetchPolicy: 'store-and-network',
});

type WebCardCategory = ArrayItemType<
  WebCardParametersScreenQuery$data['webCardCategories']
>;
type CompanyActivity = ArrayItemType<WebCardCategory['companyActivities']>;
