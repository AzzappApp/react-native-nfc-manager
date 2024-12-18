import { View, StyleSheet } from 'react-native';
import ActivityIndicator from '#ui/ActivityIndicator';

const LoadingView = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingView;
