import { View } from 'react-native';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from './ActivityIndicator';
import type { ViewProps } from 'react-native';

const ListLoadingFooter = ({
  loading,
  style,
  addBottomInset = false,
  ...props
}: ViewProps & { loading: boolean; addBottomInset?: boolean }) => {
  const { bottom } = useScreenInsets();

  return (
    <View
      collapsable={false}
      style={[
        {
          height: 48 + (addBottomInset ? bottom : 0),
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
};

export default ListLoadingFooter;
