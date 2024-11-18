import { Suspense } from 'react';
import { graphql, useClientQuery } from 'react-relay';
import { useProfileInfos } from '#hooks/authStateHooks';
import CoverRenderer from './CoverRenderer';
import type { HomeIconQuery } from '#relayArtifacts/HomeIconQuery.graphql';

type HomeIconProps = {
  webCardId: string;
};

const HomeCoverIcon = ({ webCardId }: HomeIconProps) => {
  const data = useClientQuery<HomeIconQuery>(
    graphql`
      query HomeIconQuery($webCardId: ID!) {
        node(id: $webCardId) {
          ...CoverRenderer_webCard
        }
      }
    `,
    {
      webCardId,
    },
  );

  return (
    <CoverRenderer webCard={data.node} width={COVER_WIDTH} canPlay={false} />
  );
};

export const HomeIcon = () => {
  const profileInfos = useProfileInfos();

  if (!profileInfos?.webCardId) {
    return <CoverRenderer width={COVER_WIDTH} webCard={null} />;
  }

  return (
    <Suspense fallback={<CoverRenderer width={COVER_WIDTH} webCard={null} />}>
      <HomeCoverIcon webCardId={profileInfos.webCardId} />
    </Suspense>
  );
};

const COVER_WIDTH = 18;
