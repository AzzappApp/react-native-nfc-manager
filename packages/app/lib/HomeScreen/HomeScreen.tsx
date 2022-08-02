import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import Header from '../components/Header';
import Link from '../components/Link';
import { useCurrentRoute } from '../PlatformEnvironment';
import RecommandedUsersList from './RecommandedUsersList';
import type { HomeScreen_viewer$key } from '@azzapp/relay/artifacts/HomeScreen_viewer.graphql';

type HomeScreenProps = {
  logout: () => void;
  viewer: HomeScreen_viewer$key;
};

const HomeScreen = ({ viewer: viewerRef, logout }: HomeScreenProps) => {
  const viewer = useFragment(
    graphql`
      fragment HomeScreen_viewer on Viewer {
        user {
          id
        }
        ...RecommandedUsersList_viewer
      }
    `,
    viewerRef,
  );

  const currentRoute = useCurrentRoute('willChange');
  return (
    <SafeAreaView style={styles.container}>
      <Header title="AZZAPP" />
      <RecommandedUsersList
        viewer={viewer}
        canPlay={currentRoute.route === 'HOME'}
        style={styles.recommandedUsersList}
      />
      {viewer.user ? (
        <>
          <TouchableOpacity onPress={logout}>
            <Text>Logout</Text>
          </TouchableOpacity>
          <Link route="NEW_POST">
            <Pressable>
              <Text>New Post</Text>
            </Pressable>
          </Link>
        </>
      ) : (
        <>
          <Link modal route="SIGN_IN">
            <Pressable>
              <Text>Signin</Text>
            </Pressable>
          </Link>
          <Link modal route="SIGN_UP">
            <Pressable>
              <Text>Signup</Text>
            </Pressable>
          </Link>
        </>
      )}
    </SafeAreaView>
  );
};

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
