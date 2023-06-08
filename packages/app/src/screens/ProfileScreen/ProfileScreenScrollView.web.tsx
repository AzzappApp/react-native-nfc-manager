import { omit } from 'lodash';
import { ScrollView } from 'react-native';
import type { ProfileScreenScrollViewProps } from './profileScreenTypes';

/**
 * Web specific footer for the profile screen
 * It's just a ScrollView since edit mode is not supported on web
 */
const ProfileScreenScrollView = (props: ProfileScreenScrollViewProps) => {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      contentInsetAdjustmentBehavior="never"
      {...omit(props, 'ready', 'editing')}
    />
  );
};

export default ProfileScreenScrollView;
