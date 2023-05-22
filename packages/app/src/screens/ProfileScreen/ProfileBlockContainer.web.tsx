import type { ProfileBlockContainerProps } from './profileScreenTypes';

/**
 * Web specific container for the profile screen
 * Simply return the children since edit mode is not supported on web
 */
const ProfileBlockContainer = ({
  children,
  visible,
}: ProfileBlockContainerProps) => (visible ? children : null);

export default ProfileBlockContainer;
