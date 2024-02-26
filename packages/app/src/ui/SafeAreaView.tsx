import { SafeAreaView as BaseSafeAreaView } from 'react-native';
import useScreenInsets from '#hooks/useScreenInsets';
import type { SafeAreaViewProps } from 'react-native-safe-area-context';

const SafeAreaView = (props: SafeAreaViewProps) => {
  const insets = useScreenInsets();
  return (
    <BaseSafeAreaView
      {...props}
      style={[props.style, { paddingTop: insets.top }]}
    />
  );
};

export default SafeAreaView;
