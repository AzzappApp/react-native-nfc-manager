import { View } from 'react-native';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    </SafeAreaView>
  </Container>
);

export default AccountDetailsScreenFallback;
