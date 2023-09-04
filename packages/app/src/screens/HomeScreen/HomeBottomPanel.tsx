import { useState, memo, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { colors } from '#theme';
import Link from '#components/Link';
import { useMainTabBarVisiblilityController } from '#components/MainTabBar';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import TabView from '#ui/TabView';
import Text from '#ui/Text';
import HomeContactCard from './HomeContactCard';
import HomeInformations from './HomeInformations';
import HomeMenu from './HomeMenu';
import HomeStatistics from './HomeStatistics';
import type { HOME_TAB } from './HomeMenu';
import type { HomeBottomPanel_user$key } from '@azzapp/relay/artifacts/HomeBottomPanel_user.graphql';
import type { HomeBottomPanelPublishMutation } from '@azzapp/relay/artifacts/HomeBottomPanelPublishMutation.graphql';
import type { SharedValue } from 'react-native-reanimated';

type HomeBottomPanelProps = {
  /**
   * the height unit determined at main screen to have a adaptable layout based on screen size
   *
   * @type {number}
   */
  containerHeight: number;
  user: HomeBottomPanel_user$key;
  /**
   * current position of the scrolling profile (based on profile index and not scrollValue )
   *
   * @type {SharedValue<number>}
   */
  currentProfileIndexSharedValue: SharedValue<number>;

  currentProfileIndex: number;
};

const HomeBottomPanel = ({
  containerHeight,
  user: userKey,
  currentProfileIndexSharedValue,
  currentProfileIndex,
}: HomeBottomPanelProps) => {
  //#region data
  const user = useFragment(
    graphql`
      fragment HomeBottomPanel_user on User {
        ...HomeContactCard_user
        ...HomeInformations_user
        ...HomeStatistics_user
        profiles {
          id
          userName
          cardIsPublished
          cardCover {
            title
          }
          profileCategory {
            id
          }
        }
      }
    `,
    userKey,
  );

  const { profiles } = user;
  const currentProfile = profiles?.[currentProfileIndex];

  const [selectedPanel, setSelectedPanel] = useState<HOME_TAB>('CONTACT_CARD');
  //#endregion

  //#region card publication
  const [commit] = useMutation<HomeBottomPanelPublishMutation>(graphql`
    mutation HomeBottomPanelPublishMutation {
      publishCard {
        profile {
          id
          cardIsPublished
        }
      }
    }
  `);

  const onPublish = () => {
    commit({
      variables: {},
      optimisticResponse: {
        publishCard: {
          profile: {
            id: currentProfile?.id,
            cardIsPublished: true,
          },
        },
      },
      onCompleted: (_, error) => {
        if (error) {
          // TODO - handle error
          console.log(error);
          return;
        }
        Toast.show({
          type: 'success',
          text1: intl.formatMessage({
            defaultMessage: 'Your WebCard has been published',
            description: 'Home Screen - webcard published toast',
          }),
        });
      },
      onError: error => {
        //TODO - handle error
        console.log(error);
      },
    });
  };
  //#endregion

  //#region panels visibility
  const profilesHasCover = useMemo(
    () => profiles?.map(profile => (profile.cardCover ? 1 : 0)) ?? [],
    [profiles],
  );

  const profilesWebcCardPublished = useMemo(
    () => profiles?.map(profile => (profile.cardIsPublished ? 1 : 0)) ?? [],
    [profiles],
  );

  const panelVisibilities = useDerivedValue(() => {
    const currentProfileIndex = currentProfileIndexSharedValue.value;
    const prev = Math.floor(currentProfileIndex);
    const next = Math.ceil(currentProfileIndex);

    const prevHasWebCover = !!profilesHasCover[prev];
    const nextHasWebCover = !!profilesHasCover[next];
    const prevWebCardPublished = !!profilesWebcCardPublished[prev];
    const nextWebCardPublished = !!profilesWebcCardPublished[next];
    const prevIsNewProfile = prev === -1;

    const newProfilePanelVisible = interpolate(
      currentProfileIndexSharedValue.value,
      [-1, 0],
      [1, 0],
    );

    const missingCoverPanelVisible = interpolate(
      currentProfileIndexSharedValue.value,
      [prev, next],
      [prevIsNewProfile || prevHasWebCover ? 0 : 1, nextHasWebCover ? 0 : 1],
    );

    const webCardPublishPanelVisible = interpolate(
      currentProfileIndexSharedValue.value,
      [prev, next],
      [
        prevIsNewProfile || prevWebCardPublished || !prevHasWebCover ? 0 : 1,
        nextWebCardPublished || !nextHasWebCover ? 0 : 1,
      ],
    );

    const bottomPanelVisible = interpolate(
      currentProfileIndexSharedValue.value,
      [prev, next],
      [
        prevIsNewProfile || !prevWebCardPublished ? 0 : 1,
        nextWebCardPublished ? 1 : 0,
      ],
    );

    return {
      newProfilePanelVisible,
      missingCoverPanelVisible,
      webCardPublishPanelVisible,
      bottomPanelVisible,
    };
  });

  const newCardPanelStyle = useAnimatedStyle(() => ({
    opacity: panelVisibilities.value.newProfilePanelVisible,
    zIndex: panelVisibilities.value.newProfilePanelVisible,
  }));
  const newCardPanelProps = useAnimatedProps(
    () =>
      ({
        pointerEvents:
          panelVisibilities.value.newProfilePanelVisible === 1
            ? 'auto'
            : 'none',
      }) as const,
  );

  const missingCoverPanelStyle = useAnimatedStyle(() => ({
    opacity: panelVisibilities.value.missingCoverPanelVisible,
    zIndex: panelVisibilities.value.missingCoverPanelVisible,
  }));
  const missingCoverPanelProps = useAnimatedProps(
    () =>
      ({
        pointerEvents:
          panelVisibilities.value.missingCoverPanelVisible === 1
            ? 'auto'
            : 'none',
      }) as const,
  );

  const webCardPublishPanelStyle = useAnimatedStyle(() => ({
    opacity: panelVisibilities.value.webCardPublishPanelVisible,
    zIndex: panelVisibilities.value.webCardPublishPanelVisible,
  }));
  const webCardPublishPanelProps = useAnimatedProps(
    () =>
      ({
        pointerEvents:
          panelVisibilities.value.webCardPublishPanelVisible === 1
            ? 'auto'
            : 'none',
      }) as const,
  );

  const bottomPanelStyle = useAnimatedStyle(() => ({
    opacity: panelVisibilities.value.bottomPanelVisible,
  }));
  const bottomPanelProps = useAnimatedProps(
    () =>
      ({
        pointerEvents:
          panelVisibilities.value.bottomPanelVisible === 1 ? 'auto' : 'none',
      }) as const,
  );

  const mainTabBarVisible = useDerivedValue(
    () => panelVisibilities.value.bottomPanelVisible,
  );
  useMainTabBarVisiblilityController(mainTabBarVisible);
  //#endregion

  const intl = useIntl();

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={[styles.informationPanel, newCardPanelStyle]}
        pointerEvents={currentProfileIndex === -1 ? 'auto' : 'none'}
        animatedProps={newCardPanelProps}
      >
        <Text variant="large" style={{ color: colors.white }}>
          <FormattedMessage
            defaultMessage="Create a new Webcard{azzappAp}"
            description="Home Screen - Create a new WebCard"
            values={{
              azzappAp: <Text variant="azzapp">a</Text>,
            }}
          />
        </Text>
        <Text variant="medium" style={styles.informationText}>
          <FormattedMessage
            defaultMessage="Introduce yourself in a new way by creating your own WebCard{azzappAp}."
            description="Home Screen - Create a new webcard description"
            values={{
              azzappAp: <Text variant="azzapp">a</Text>,
            }}
          />
        </Text>
      </Animated.View>

      <Animated.View
        style={[styles.informationPanel, missingCoverPanelStyle]}
        animatedProps={missingCoverPanelProps}
      >
        <Icon icon="warning" style={styles.warningIcon} />
        <Text variant="large" style={{ color: colors.white }}>
          <FormattedMessage
            defaultMessage="This WebCard{azzappAp} needs a cover"
            description="Home Screen - Missing cover title"
            values={{
              azzappAp: <Text variant="azzapp">a</Text>,
            }}
          />
        </Text>
        <Text variant="medium" style={styles.informationText}>
          <FormattedMessage
            defaultMessage="This WebCard{azzappAp} has no cover and can’t be published."
            description="Home Screen - Missing cover text"
            values={{
              azzappAp: <Text variant="azzapp">a</Text>,
            }}
          />
        </Text>
        <Link
          route="NEW_PROFILE"
          params={
            currentProfile?.id ? { profileId: currentProfile.id } : undefined
          }
        >
          <Button
            variant="secondary"
            appearance="dark"
            label={intl.formatMessage({
              defaultMessage: 'Create your WebCard cover',
              description: 'Home Screen - Missing cover button',
            })}
            style={styles.informationPanelButton}
          />
        </Link>
      </Animated.View>

      <Animated.View
        style={[styles.informationPanel, webCardPublishPanelStyle]}
        animatedProps={webCardPublishPanelProps}
      >
        <Icon icon="warning" style={styles.warningIcon} />
        <Text variant="large" style={{ color: colors.white }}>
          <FormattedMessage
            defaultMessage="This WebCard{azzappAp} is not published"
            description="Home Screen - webcard not published title"
            values={{
              azzappAp: <Text variant="azzapp">a</Text>,
            }}
          />
        </Text>
        <Text variant="medium" style={styles.informationText}>
          <FormattedMessage
            defaultMessage="This WebCard{azzappAp} has not been published, nobody can see it for the moment."
            description="Home Screen - webcard not published text"
            values={{
              azzappAp: <Text variant="azzapp">a</Text>,
            }}
          />
        </Text>
        <Button
          variant="secondary"
          appearance="dark"
          label={intl.formatMessage({
            defaultMessage: 'Publish this WebCard',
            description: 'Home Screen - webcard not published button',
          })}
          style={styles.informationPanelButton}
          onPress={onPublish}
        />
      </Animated.View>

      <Animated.View
        style={[styles.bottomPanel, bottomPanelStyle]}
        animatedProps={bottomPanelProps}
      >
        <HomeMenu selected={selectedPanel} setSelected={setSelectedPanel} />

        <TabView
          style={{ flex: 1 }}
          tabs={[
            {
              id: 'CONTACT_CARD',
              element: (
                <HomeContactCard
                  user={user}
                  height={2 * containerHeight}
                  currentProfileIndexSharedValue={
                    currentProfileIndexSharedValue
                  }
                />
              ),
            },
            {
              id: 'STATS',
              element: (
                <HomeStatistics
                  user={user}
                  height={2 * containerHeight}
                  animated={selectedPanel === 'STATS'}
                  currentProfileIndexSharedValue={
                    currentProfileIndexSharedValue
                  }
                  currentUserIndex={currentProfileIndex}
                />
              ),
            },
            {
              id: 'INFORMATION',
              element: (
                <HomeInformations
                  user={user}
                  animated={selectedPanel === 'INFORMATION'}
                  currentProfileIndexSharedValue={
                    currentProfileIndexSharedValue
                  }
                />
              ),
            },
          ]}
          currentTab={selectedPanel}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  informationPanel: {
    overflow: 'visible',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  informationText: {
    textAlign: 'center',
    color: colors.white,
    marginHorizontal: 50,
    marginTop: 10,
  },
  warningIcon: {
    tintColor: colors.white,
    marginBottom: 20,
    width: 20,
    height: 20,
  },
  bottomPanel: {
    overflow: 'visible',
    flex: 1,
  },
  informationPanelButton: {
    marginTop: 30,
  },
});

export default memo(HomeBottomPanel);
