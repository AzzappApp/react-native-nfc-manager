'use client';

import { useRouter } from '@azzapp/app/lib/PlatformEnvironment';
import UserScreen from '@azzapp/app/lib/screens/UserScreen';
import useClientLazyLoadQuery from '@azzapp/shared/lib/useClientLazyLoadQuery';
import { graphql } from 'react-relay';
import useServerQuery from '../../../hooks/useServerQuery';
import type { ServerQuery } from '../../../helpers/preloadServerQuery';
import type { UserWebScreenUserQuery } from '@azzapp/relay/artifacts/UserWebScreenUserQuery.graphql';
import type { UserWebScreenViewerQuery } from '@azzapp/relay/artifacts/UserWebScreenViewerQuery.graphql';

type UserWebScreenProps = {
  serverQuery: ServerQuery<UserWebScreenUserQuery>;
};

const UserWebScreen = ({ serverQuery }: UserWebScreenProps) => {
  const { user } = useServerQuery<UserWebScreenUserQuery>(
    graphql`
      query UserWebScreenUserQuery($userName: String!) {
        user(userName: $userName) {
          ...UserScreenFramgent_user
        }
      }
    `,
    serverQuery,
  );

  // TODO improve this way to get the viewer
  const {
    data: { viewer },
  } = useClientLazyLoadQuery<UserWebScreenViewerQuery>(
    graphql`
      query UserWebScreenViewerQuery {
        viewer {
          ...UserScreenFramgent_viewer
        }
      }
    `,
    {},
  );

  const router = useRouter();
  const onBack = () => {
    router.back();
  };

  return <UserScreen onBack={onBack} user={user!} viewer={viewer} />;
};

export default UserWebScreen;
