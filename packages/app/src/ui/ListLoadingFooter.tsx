import { View } from 'react-native';
import ActivityIndicator from './ActivityIndicator';
import type { ViewProps } from 'react-native';

const ListLoadingFooter = ({
  loading,
  style,
  ...props
}: ViewProps & { loading: boolean }) => (
  <View
    style={[
      {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      },
      style,
    ]}
    {...props}
  >
    {loading && <ActivityIndicator />}
  </View>
);

export default ListLoadingFooter;
