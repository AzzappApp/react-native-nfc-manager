import { View } from 'react-native';
import useScreenInsets from '#hooks/useScreenInsets';
import type { ViewProps } from 'react-native';

const SafeAreaView = ({ style, ...props }: ViewProps) => {
  const insets = useScreenInsets();

  return (
    <View
      style={[{ paddingTop: insets.top, paddingBottom: insets.bottom }, style]}
      {...props}
    />
  );
};

export default SafeAreaView;
