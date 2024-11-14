import Container from '#ui/Container';
import LoadingView from '#ui/LoadingView';
import SafeAreaView from '#ui/SafeAreaView';
import AccountDetailsHeader from './AccountDetailsHeader';

const AccountDetailsScreenFallback = () => (
  <Container style={{ flex: 1 }}>
    <SafeAreaView
      style={{
        flex: 1,
        rowGap: 15,
      }}
    >
      <AccountDetailsHeader />
      <LoadingView />
    </SafeAreaView>
  </Container>
);

export default AccountDetailsScreenFallback;
