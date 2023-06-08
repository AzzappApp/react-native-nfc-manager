import { StyleSheet } from 'react-native';
import ProfileScreenButtonBar from './ProfileScreenButtonBar';
import type { ProfileScreenFooterProps } from './profileScreenTypes';

/**
 * Web specific footer for the profile screen
 * Only display the button bar since edit mode is not supported on web
 */
const ProfileScreenFooter = ({
  userName,
  onHome,
  onEdit,
  onToggleFollow,
}: ProfileScreenFooterProps) => (
  <ProfileScreenButtonBar
    userName={userName}
    onHome={onHome}
    onEdit={onEdit}
    onToggleFollow={onToggleFollow}
    style={styles.buttonBar}
  />
);

export default ProfileScreenFooter;

const styles = StyleSheet.create({
  buttonBar: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: 15,
    zIndex: 1,
    bottom: `calc(env(safe-area-inset-bottom, 0px) + 10px)`,
  },
});
