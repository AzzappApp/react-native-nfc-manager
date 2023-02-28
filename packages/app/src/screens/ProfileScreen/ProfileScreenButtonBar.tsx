import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, Text, View } from 'react-native';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { textStyles } from '#theme';
import Link from '#components/Link';
import ClientOnlySuspense from '#ui/ClientOnlySuspense';
import FloatingButton from '#ui/FloatingButton';
import FloatingIconButton from '#ui/FloatingIconButton';
import type { ProfileScreenButtonBarQuery } from '@azzapp/relay/artifacts/ProfileScreenButtonBarQuery.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type ProfileScreenButtonBarProps = {
  userName: string;
  onEdit: () => void;
  onHome: () => void;
  onToggleFollow: (follow: boolean) => void;
  style?: StyleProp<ViewStyle>;
};

const ProfileScreenButtonBar = (props: ProfileScreenButtonBarProps) => {
  const { userName, style, onHome } = props;

  return (
    <View style={[styles.buttonBar, style]}>
      <FloatingIconButton icon="azzapp" onPress={onHome} iconSize={23} />
      <ClientOnlySuspense
        fallback={
          <View style={[styles.mainButton, styles.mainButtonFallback]} />
        }
      >
        <ProfileScreenButtonActionButton {...props} />
      </ClientOnlySuspense>
      <Link route="PROFILE_POSTS" params={{ userName }}>
        <FloatingIconButton
          icon="flip"
          iconSize={30}
          style={styles.userPostsButton}
        />
      </Link>
    </View>
  );
};

export default ProfileScreenButtonBar;

const ProfileScreenButtonActionButton = ({
  userName,
  onEdit,
  onToggleFollow,
}: ProfileScreenButtonBarProps) => {
  const { profile, viewer } = useLazyLoadQuery<ProfileScreenButtonBarQuery>(
    graphql`
      query ProfileScreenButtonBarQuery($userName: String!) {
        profile(userName: $userName) {
          isFollowing
        }
        viewer {
          profile {
            userName
          }
        }
      }
    `,
    { userName },
  );

  const canEdit = userName === viewer.profile?.userName;
  const { isFollowing } = profile ?? { isFollowing: false };

  const intl = useIntl();
  return canEdit ? (
    <FloatingButton
      variant="light"
      onPress={onEdit}
      style={styles.mainButton}
      accessibilityLabel={intl.formatMessage({
        defaultMessage: 'Tap to edit your profile',
        description: 'UserScreenButtonBar edit button accessibility label',
      })}
    >
      <Text style={textStyles.normal}>
        <FormattedMessage
          defaultMessage="Edit my profile"
          description="Edit my profile button label in Profile Screen Button Bar"
        />
      </Text>
    </FloatingButton>
  ) : (
    <FloatingButton
      variant="light"
      onPress={() => onToggleFollow(!isFollowing)}
      style={styles.mainButton}
      accessibilityLabel={intl.formatMessage({
        defaultMessage: 'Tap to follow the profile',
        description: 'UserScreenButtonBar follow profile accessibility label',
      })}
    >
      <Text style={textStyles.normal}>
        {isFollowing ? (
          <FormattedMessage
            defaultMessage="Follow"
            description="Follow button label in Profile Screen Button Bar"
          />
        ) : (
          <FormattedMessage
            defaultMessage="Unfollow"
            description="Unfollow button label in Profile Screen Button Bar"
          />
        )}
      </Text>
    </FloatingButton>
  );
};

const styles = StyleSheet.create({
  buttonBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainButton: {
    flex: 1,
    marginLeft: 15,
  },
  mainButtonFallback: {
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  userPostsButton: {
    marginLeft: 15,
  },
});
