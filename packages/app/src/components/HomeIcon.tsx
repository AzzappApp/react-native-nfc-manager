import { Suspense } from 'react';
import { graphql, useLazyLoadQuery } from 'react-relay';
import ProfileBoundRelayEnvironmentProvider from '#helpers/ProfileBoundRelayEnvironmentProvider';
import useAuthState from '#hooks/useAuthState';
import CoverRenderer from './CoverRenderer';
import type { HomeIconQuery } from '@azzapp/relay/artifacts/HomeIconQuery.graphql';

type HomeIconProps = {
  profileId: string;
};

const HomeCoverIcon = ({ profileId }: HomeIconProps) => {
  const data = useLazyLoadQuery<HomeIconQuery>(
    graphql`
      query HomeIconQuery($profileId: ID!) {
        node(id: $profileId) {
          ...CoverRenderer_profile
        }
      }
    `,
    {
      profileId,
    },
    { fetchPolicy: 'store-only' },
  );

  return (
    <CoverRenderer
      profile={data.node}
      width={COVER_WIDTH}
      style={{ marginBottom: -1 }}
    />
  );
};

export const HomeIcon = () => {
  const { profileId } = useAuthState();

  return (
    <ProfileBoundRelayEnvironmentProvider profileId={profileId}>
      <Suspense fallback={<CoverRenderer width={COVER_WIDTH} profile={null} />}>
        {profileId && <HomeCoverIcon profileId={profileId} />}
      </Suspense>
    </ProfileBoundRelayEnvironmentProvider>
  );
};

const COVER_WIDTH = 18;
