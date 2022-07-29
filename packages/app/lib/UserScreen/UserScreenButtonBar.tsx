import { StyleSheet, Text, View } from 'react-native';
import { textStyles } from '../../theme';
import FloatingButton from '../components/FloatingButton';
import FloatingIconButton from '../components/FloatingIconButton';
import { useRouter } from '../PlatformEnvironment';
import type { StyleProp, ViewStyle } from 'react-native';

type UserScreenButtonBarProps = {
  userId: string;
  canEdit: boolean;
  onEdit: () => void;
  onHome: () => void;
  onFollow: () => void;
  style?: StyleProp<ViewStyle>;
};

const UserScreenButtonBar = ({
  canEdit,
  style,
  userId,
  onEdit,
  onFollow,
  onHome,
}: UserScreenButtonBarProps) => {
  const router = useRouter();
  const onFlip = () => router.push('USER_POSTS', { userId });

  return (
    <View style={[styles.buttonBar, style]}>
      <FloatingIconButton icon="azzapp" onPress={onHome} iconSize={23} />
      {canEdit ? (
        <FloatingButton light onPress={onEdit} style={styles.mainButton}>
          <Text style={textStyles.normal}>Edit my profile</Text>
        </FloatingButton>
      ) : (
        <FloatingButton light onPress={onFollow} style={styles.mainButton}>
          <Text style={textStyles.normal}>Follow</Text>
        </FloatingButton>
      )}
      <FloatingIconButton
        icon="flip"
        onPress={onFlip}
        iconSize={30}
        style={{ marginLeft: 15 }}
      />
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
