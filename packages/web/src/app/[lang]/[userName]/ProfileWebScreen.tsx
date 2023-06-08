'use client';

import { graphql } from 'react-relay';
import ProfileScreen from '@azzapp/app/screens/ProfileScreen';
import useServerQuery from '#hooks/useServerQuery';
import type { ServerQuery } from '#helpers/preloadServerQuery';
import type { ProfileWebScreenQuery } from '@azzapp/relay/artifacts/ProfileWebScreenQuery.graphql';

type UserWebScreenProps = {
  serverQuery: ServerQuery<ProfileWebScreenQuery>;
};

const UserWebScreen = ({ serverQuery }: UserWebScreenProps) => {
  const { profile, viewer } = useServerQuery<ProfileWebScreenQuery>(
    graphql`
      query ProfileWebScreenQuery($userName: String!) {
        viewer {
          profile {
            id
          }
        }
        profile(userName: $userName) {
          ...ProfileScreen_profile
        }
      }
    `,
    serverQuery,
  );

  return (
    <ProfileScreen profile={profile!} userProfileId={viewer.profile?.id} />
  );
};

export default UserWebScreen;
