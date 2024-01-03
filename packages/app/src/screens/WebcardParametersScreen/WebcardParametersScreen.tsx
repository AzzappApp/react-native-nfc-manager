import { useCallback, useEffect, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { graphql, useMutation, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useToggle from '#hooks/useToggle';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Select from '#ui/Select';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import WebcardParametersHeader from './WebcardParametersHeader';
import WebcardParametersNameForm from './WebcardParametersNameForm';
import WebcardParametersScreenFallback from './WebcardParametersScreenFallback';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { WebcardParametersRoute } from '#routes';
import type { WebcardParametersScreenMutation } from '@azzapp/relay/artifacts/WebcardParametersScreenMutation.graphql';
import type { WebcardParametersScreenPublishMutation } from '@azzapp/relay/artifacts/WebcardParametersScreenPublishMutation.graphql';
import type {
  WebcardParametersScreenQuery,
  WebcardParametersScreenQuery$data,
} from '@azzapp/relay/artifacts/WebcardParametersScreenQuery.graphql';
import type { WebcardParametersScreenUnPublishMutation } from '@azzapp/relay/artifacts/WebcardParametersScreenUnPublishMutation.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';

const webcardParametersScreenQuery = graphql`
  query WebcardParametersScreenQuery {
    viewer {
      profile {
        id
        webCard {
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
          ...AccountHeader_webCard
        }
      }
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

const WebcardParametersScreen = ({
  preloadedQuery,
}: RelayScreenProps<WebcardParametersRoute, WebcardParametersScreenQuery>) => {
  const {
    viewer: { profile },
    webCardCategories,
    webCardParameters: { userNameChangeFrequencyDay },
  } = usePreloadedQuery(webcardParametersScreenQuery, preloadedQuery);
  const webCard = profile?.webCard ?? null;
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);
  const [userNameFormVisible, toggleUserNameFormVisible] = useToggle(false);
  const activities = useMemo(
    () =>
      webCardCategories?.find(a => a.id === webCard?.webCardCategory?.id)
        ?.companyActivities,
    [webCard?.webCardCategory?.id, webCardCategories],
  );

  const [publish] = useMutation<WebcardParametersScreenPublishMutation>(graphql`
    mutation WebcardParametersScreenPublishMutation {
      publishCard {
        webCard {
          id
          cardIsPublished
          alreadyPublished
        }
      }
    }
  `);

  const [unpublish] = useMutation<WebcardParametersScreenUnPublishMutation>(
    graphql`
      mutation WebcardParametersScreenUnPublishMutation {
        unpublishCard {
          webCard {
            id
            cardIsPublished
            alreadyPublished
          }
        }
      }
    `,
  );

  const onChangeIsPublished = useCallback(
    (value: boolean) => {
      if (value) {
        publish({ variables: {} });
      } else {
        unpublish({ variables: {} });
      }
    },
    [publish, unpublish],
  );

  useEffect(() => {
    //TODO: remove this later,
    // the already published flag was initalized at false and does not reflect the cardIsPublished actual flag
    if (webCard && webCard.cardIsPublished && !webCard.alreadyPublished) {
      publish({ variables: {} });
    }
  }, [publish, webCard, webCard?.alreadyPublished, webCard?.cardIsPublished]);

  const [commit] = useMutation<WebcardParametersScreenMutation>(graphql`
    mutation WebcardParametersScreenMutation($input: UpdateWebCardInput!) {
      updateWebCard(input: $input) {
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
  `);

  const updateWebCardCategory = useCallback(
    (webCardCategory: WebCardCategory) => {
      commit({
        variables: {
          input: {
            webCardCategoryId: webCardCategory.id,
            webCardKind: webCardCategory.webCardKind,
            companyActivityId: undefined,
          },
        },
        onError: error => {
          console.log(error);
        },
      });
    },
    [commit],
  );

  const updateProfileActivity = useCallback(
    (activity: CompanyActivity) => {
      commit({
        variables: {
          input: {
            companyActivityId: activity.id,
          },
        },
      });
    },
    [commit],
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
              'WebcardParameters Screen : Toast Error message when not authorize to change the Webcard name',
          },
          {
            azzappA: <Text variant="azzapp">a</Text>,
          },
        ) as string,
        text2: intl.formatMessage(
          {
            defaultMessage: 'The {dateChange} at {timeChange}',
            description:
              'WebcardParameters Screen : Toast Error message when not authorize to change the Webcard name',
          },
          {
            dateChange: webCard?.nextChangeUsernameAllowedAt
              ? intl.formatDate(webCard?.nextChangeUsernameAllowedAt)
              : 'unknwon date',
            timeChange: webCard?.nextChangeUsernameAllowedAt
              ? intl.formatTime(webCard?.nextChangeUsernameAllowedAt)
              : 'unknwon date',
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
          rowGap: 15,
          paddingHorizontal: 10,
        }}
      >
        <WebcardParametersHeader webCard={webCard ?? null} />
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
        <PressableNative style={styles.sectionField} onPress={onPressUserName}>
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
                  'WebcardParameters screen - Profile Categoriy BottomSheet - Title',
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
                  'WebcardParameters screen - Activity BottomSheet - Title',
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
                  'WebcardParameters screen Name Company Screen - Accessibility TextInput Placeholder Choose a company activity',
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
        {profile && (
          <WebcardParametersNameForm
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

export default relayScreen(WebcardParametersScreen, {
  query: webcardParametersScreenQuery,
  fallback: WebcardParametersScreenFallback,
  fetchPolicy: 'store-and-network',
});

type WebCardCategory = ArrayItemType<
  WebcardParametersScreenQuery$data['webCardCategories']
>;
type CompanyActivity = ArrayItemType<WebCardCategory['companyActivities']>;
