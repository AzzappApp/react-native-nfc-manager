import { SafeAreaView, View, ActivityIndicator } from 'react-native';
import Container from '#ui/Container';
import WebcardParametersHeader from './WebcardParametersHeader';

const WebcardParametersScreenFallback = () => (
  <Container style={{ flex: 1 }}>
    <SafeAreaView
      style={{
        flex: 1,
        rowGap: 15,
      }}
    >
      <WebcardParametersHeader webCard={null} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    </SafeAreaView>
  </Container>
);

export default WebcardParametersScreenFallback;
