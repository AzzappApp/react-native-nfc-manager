import { StyleSheet, Text, View } from 'react-native';
import { textStyles } from '../../theme';
import Link from '../components/Link';
import FloatingButton from '../ui/FloatingButton';
import FloatingIconButton from '../ui/FloatingIconButton';
import type { StyleProp, ViewStyle } from 'react-native';

type UserScreenButtonBarProps = {
  userName: string;
  canEdit: boolean;
  onEdit: () => void;
  onHome: () => void;
  onFollow: () => void;
  style?: StyleProp<ViewStyle>;
};

const UserScreenButtonBar = ({
  userName,
  canEdit,
  style,
  onEdit,
  onFollow,
  onHome,
}: UserScreenButtonBarProps) => (
  <View style={[styles.buttonBar, style]}>
    <FloatingIconButton icon="azzapp" onPress={onHome} iconSize={23} />
    {canEdit ? (
      <FloatingButton light onPress={onEdit} style={styles.mainButton}>
        {/* @ts-expect-error suppressHydrationWarning is not typed*/}
        <Text style={textStyles.normal} suppressHydrationWarning>
          Edit my profile
        </Text>
      </FloatingButton>
    ) : (
      <FloatingButton light onPress={onFollow} style={styles.mainButton}>
        {/* @ts-expect-error suppressHydrationWarning is not typed*/}
        <Text style={textStyles.normal} suppressHydrationWarning>
          Follow
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
