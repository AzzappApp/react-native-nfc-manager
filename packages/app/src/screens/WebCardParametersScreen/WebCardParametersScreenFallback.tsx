import Container from '#ui/Container';
import LoadingView from '#ui/LoadingView';
import SafeAreaView from '#ui/SafeAreaView';
import WebCardParametersHeader from './WebCardParametersHeader';

const WebCardParametersScreenFallback = () => (
  <Container style={{ flex: 1 }}>
    <SafeAreaView
      style={{
        flex: 1,
        rowGap: 15,
      }}
    >
      <WebCardParametersHeader webCard={null} />
      <LoadingView />
    </SafeAreaView>
  </Container>
);

export default WebCardParametersScreenFallback;
