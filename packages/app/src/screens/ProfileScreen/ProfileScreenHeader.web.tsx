import { StyleSheet } from 'react-native';
import { colors } from '#theme';
import FloatingIconButton from '#ui/FloatingIconButton';
import type { ProfileScreenHeaderProps } from './profileScreenTypes';

/**
 * Web specific header for the profile screen
 * Only display a close button since edit mode is not supported on web
 */
const ProfileScreenHeader = ({ onClose }: ProfileScreenHeaderProps) => (
  <FloatingIconButton
    icon="arrow_down"
    onPress={onClose}
    iconSize={30}
    variant="grey"
    iconStyle={{ tintColor: colors.white }}
    style={styles.closeButton}
  />
);

export default ProfileScreenHeader;

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    start: 15,
    zIndex: 1,
    top: `calc(env(safe-area-inset-top, 0px) + 16px)`,
  },
});
