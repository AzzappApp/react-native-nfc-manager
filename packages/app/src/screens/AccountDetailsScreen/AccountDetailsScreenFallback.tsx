import Container from '#ui/Container';
import LoadingView from '#ui/LoadingView';
import AccountDetailsHeader from './AccountDetailsHeader';

const AccountDetailsScreenFallback = () => (
  <Container style={{ flex: 1 }}>
    <AccountDetailsHeader />
    <LoadingView />
  </Container>
);

export default AccountDetailsScreenFallback;
