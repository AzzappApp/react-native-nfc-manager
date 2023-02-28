import { View, StyleSheet } from 'react-native';

import type { StyleProp, ViewStyle } from 'react-native';

type SkeletonProps = {
  style: StyleProp<ViewStyle>;
  highLightColor?: string;
  duration?: number;
};
const Skeleton = ({ style }: SkeletonProps) => {
  return <View style={[style, styles.container]} />;
};
export default Skeleton;

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
