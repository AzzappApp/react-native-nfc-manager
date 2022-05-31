import ROUTES from '@azzapp/shared/lib/routes';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { graphql } from 'react-relay';
import Header from '../components/Header';
import Link from '../components/Link';
import RecommandedUsersList from './RecommandedUsersList';
import type {
  HomeScreenQuery,
  HomeScreenQuery$data,
} from '@azzapp/relay/artifacts/HomeScreenQuery.graphql';

type HomeScreenProps = {
  data: HomeScreenQuery$data;
  logout: () => void;
};

export const homeScreenQuery = graphql`
  query HomeScreenQuery {
    viewer {
      user {
        id
      }
      ...RecommandedUsersList_viewer
    }
  }
`;

const HomeScreen = ({ data, logout }: HomeScreenProps) => (
  <SafeAreaView style={styles.container}>
    <Header title="AZZAPP" />
    <RecommandedUsersList
      viewer={data.viewer}
      style={styles.recommandedUsersList}
    />
    {data.viewer.user ? (
      <TouchableOpacity onPress={logout}>
        <Text>Logout</Text>
      </TouchableOpacity>
    ) : (
      <>
        <Link modal route={ROUTES.SIGN_IN}>
          <Text>Signin</Text>
        </Link>
        <Link modal route={ROUTES.SIGN_UP}>
          <Text>Signup</Text>
        </Link>
      </>
    )}
  </SafeAreaView>
);

export type { HomeScreenQuery };

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  recommandedUsersList: {
    height: 200,
    flexGrow: 0,
    marginTop: 10,
    marginBottom: 20,
  },
});
