import * as Sentry from '@sentry/react-native';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, useWindowDimensions, StyleSheet, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useFragment } from 'react-relay';
import { useDebouncedCallback } from 'use-debounce';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import BottomSheetModal from '#ui/BottomSheetModal';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ProfileWebcardModal_profile$key } from '@azzapp/relay/artifacts/ProfileWebcardModal_profile.graphql';

type ProfileWebCardModalProps = {
  close: () => void;
  /**
   *
   *
   * @type {ProfileWebcardModal_profile$key}
   */
  profile: ProfileWebcardModal_profile$key;
  /**
   *
   *
   * @type {boolean}
   */
  isViewer: boolean;
  /**
   *
   *
   * @type {boolean}
   */
  visible: boolean;
  /**
   * callback to follow/unfollow
   *
   */
  onToggleFollow: (
    profileId: string,
    userName: string,
    follow: boolean,
  ) => void;
};

const ProfileWebCardModal = ({
  profile: profileKey,
  onToggleFollow,
  visible,
  close,
  isViewer,
}: ProfileWebCardModalProps) => {
  const profile = useFragment(
    graphql`
      fragment ProfileWebcardModal_profile on Profile {
        id
        userName
        nbPosts
        nbFollowers
        nbFollowings
        isFollowing
        ...CoverRenderer_profile
      }
    `,
    profileKey,
  );

  const { width: windowsWith, height: windowsHeight } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const intl = useIntl();

  const onShare = async () => {
    // a quick share method using the native share component. If we want to make a custom share (like tiktok for example, when they are recompressiong the media etc) we can use react-native-shares
    try {
      await Share.share(
        {
          url: buildUserUrl(profile.userName),
        },
        {
          dialogTitle: intl.formatMessage({
            defaultMessage: 'Azzapp | An app made for your business',
            description:
              'Profile WebcardModal, message use when sharing the contact card',
          }),
          subject: intl.formatMessage({
            defaultMessage: 'Azzapp | An app made for your business',
            description:
              'Profile WebcardModal, message use when sharing the contact card',
          }),
        },
      );
      //TODO: handle result of the share when specified
    } catch (error: any) {
      Sentry.captureException(error);
    }
  };

  const debouncedToggleFollowing = useDebouncedCallback(() => {
    onToggleFollow(profile.id, profile.userName, !profile.isFollowing);
  }, 600);

  return (
    <BottomSheetModal
      height={windowsHeight - top - 30}
      visible={visible}
      onRequestClose={close}
    >
      <Container>
        <Header
          leftElement={
            <IconButton
              icon="arrow_down"
              onPress={close}
              iconSize={28}
              variant="icon"
            />
          }
          middleElement={<Text variant="large">{profile.userName}</Text>}
          rightElement={null}
        />
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 20,
          }}
        >
          <CoverRenderer
            profile={profile}
            width={windowsWith / 3}
            videoEnabled={false}
          />
        </View>
        <View style={styles.countersContainer}>
          <View style={styles.counterContainer}>
            <Text variant="xlarge">{profile?.nbPosts}</Text>
            <Text variant="small" style={styles.counterValue} numberOfLines={1}>
              <FormattedMessage
                defaultMessage="Posts"
                description="Number of posts"
              />
            </Text>
          </View>

          <View style={styles.counterContainer}>
            <Text variant="xlarge">{profile?.nbFollowers}</Text>
            <Text variant="small" style={styles.counterValue} numberOfLines={1}>
              <FormattedMessage
                defaultMessage="Followers"
                description="Number of followers"
              />
            </Text>
          </View>
          <View style={styles.counterContainer}>
            <Text variant="xlarge">{profile?.nbFollowings}</Text>
            <Text variant="small" style={styles.counterValue} numberOfLines={1}>
              <FormattedMessage
                defaultMessage="Followings"
                description="Number of followed profiles"
              />
            </Text>
          </View>
        </View>
        <View style={styles.bottomSheetOptionsContainer}>
          <PressableNative
            style={styles.bottomSheetOptionButton}
            onPress={onShare}
          >
            <View style={styles.bottomSheetOptionContainer}>
              <View style={styles.bottomSheetOptionIconLabel}>
                <Icon icon="share" />
                <Text>
                  <FormattedMessage
                    defaultMessage="Share this Webcard{azzappAp}"
                    description="Profile webcard modal - Share thie Webcard"
                    values={{
                      azzappAp: <Text variant="azzapp">a</Text>,
                    }}
                  />
                </Text>
              </View>
            </View>
          </PressableNative>
          {!isViewer && (
            <PressableNative
              style={styles.bottomSheetOptionButton}
              onPress={debouncedToggleFollowing}
            >
              <View style={styles.bottomSheetOptionIconLabel}>
                <Icon
                  icon={profile.isFollowing ? 'delete_filled' : 'add_circle'}
                />
                <Text>
                  {profile.isFollowing ? (
                    <FormattedMessage
                      defaultMessage="Unfollow"
                      description="Unfollow button label in Profile webcard modal Button"
                    />
                  ) : (
                    <FormattedMessage
                      defaultMessage="Follow"
                      description="Follow button label in Profile webcard modal Button"
                    />
                  )}
                </Text>
              </View>
            </PressableNative>
          )}
        </View>
      </Container>
    </BottomSheetModal>
  );
};

export default ProfileWebCardModal;

const styles = StyleSheet.create({
  countersContainer: {
    flexDirection: 'row',
    columnGap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.grey100,
    height: 60,
  },
  bottomSheetOptionsContainer: {
    paddingTop: 20,
    rowGap: 20,
  },
  counterContainer: { width: 12, alignItems: 'center', flex: 1 },
  counterValue: {
    color: colors.grey400,
  },
  profileDataContainer: {
    maxWidth: 355,
    padding: 20,
    alignSelf: 'center',
    alignItems: 'center',
    width: '100%',
    rowGap: 10,
  },
  bottomSheetOptionButton: {
    height: 32,
  },
  bottomSheetOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  bottomSheetOptionIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
});
