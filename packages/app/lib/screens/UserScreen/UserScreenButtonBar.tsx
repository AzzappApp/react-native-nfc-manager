import { useIntl } from 'react-intl';
import { StyleSheet, Text, View } from 'react-native';
import { textStyles } from '../../../theme';
import Link from '../../components/Link';
import FloatingButton from '../../ui/FloatingButton';
import FloatingIconButton from '../../ui/FloatingIconButton';
import type { StyleProp, ViewStyle } from 'react-native';

type UserScreenButtonBarProps = {
  userName: string;
  canEdit: boolean;
  isFollowing: boolean;
  onEdit: () => void;
  onHome: () => void;
  onFollow: () => void;
  style?: StyleProp<ViewStyle>;
};

const UserScreenButtonBar = ({
  userName,
  canEdit,
  isFollowing,
  style,
  onEdit,
  onFollow,
  onHome,
}: UserScreenButtonBarProps) => {
  const intl = useIntl();
  return (
    <View style={[styles.buttonBar, style]}>
      <FloatingIconButton icon="azzapp" onPress={onHome} iconSize={23} />
      {canEdit ? (
        <FloatingButton
          variant="light"
          onPress={onEdit}
          style={styles.mainButton}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Tap to edit your profile',
            description: 'UserScreenButtonBar edit button accessibility label',
          })}
        >
          {/* @ts-expect-error suppressHydrationWarning is not typed*/}
          <Text style={textStyles.normal} suppressHydrationWarning>
            Edit my profile
          </Text>
        </FloatingButton>
      ) : (
        <FloatingButton
          variant="light"
          onPress={onFollow}
          style={styles.mainButton}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Tap to follow the profile',
            description:
              'UserScreenButtonBar follow profile accessibility label',
          })}
        >
          {/* @ts-expect-error suppressHydrationWarning is not typed*/}
          <Text style={textStyles.normal} suppressHydrationWarning>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Text>
        </FloatingButton>
      )}
      <Link route="USER_POSTS" params={{ userName }}>
        <FloatingIconButton
          icon="flip"
          iconSize={30}
          style={{ marginLeft: 15 }}
        />
      </Link>
    </View>
  );
};

export default UserScreenButtonBar;

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
  scrollViewContainer: {
    flexGrow: 1,
  },
});
