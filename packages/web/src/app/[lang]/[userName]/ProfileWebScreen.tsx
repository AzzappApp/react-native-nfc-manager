'use client';

import ProfileScreen from '@azzapp/app/lib/screens/ProfileScreen';
import { graphql } from 'react-relay';
import useServerQuery from '../../../hooks/useServerQuery';
import type { ServerQuery } from '../../../helpers/preloadServerQuery';
import type { ProfileWebScreenQuery } from '@azzapp/relay/artifacts/ProfileWebScreenQuery.graphql';

type UserWebScreenProps = {
  serverQuery: ServerQuery<ProfileWebScreenQuery>;
};

const UserWebScreen = ({ serverQuery }: UserWebScreenProps) => {
  const { profile } = useServerQuery<ProfileWebScreenQuery>(
    graphql`
      query ProfileWebScreenQuery($userName: String!) {
        profile(userName: $userName) {
          ...ProfileScreen_profile
        }
      }
    `,
    serverQuery,
  );

  return <ProfileScreen profile={profile!} />;
};

export default UserWebScreen;
