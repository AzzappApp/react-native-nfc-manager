import Container from '#ui/Container';
import LoadingView from '#ui/LoadingView';
import WebCardParametersHeader from './WebCardParametersHeader';

const WebCardParametersScreenFallback = () => (
  <Container style={{ flex: 1 }}>
    <WebCardParametersHeader webCard={null} />
    <LoadingView />
  </Container>
);

export default WebCardParametersScreenFallback;
