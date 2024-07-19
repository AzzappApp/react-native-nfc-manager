import { Suspense } from 'react';
import { graphql, useLazyLoadQuery } from 'react-relay';
import useAuthState from '#hooks/useAuthState';
import CoverRenderer from './CoverRenderer';
import type { HomeIconQuery } from '#relayArtifacts/HomeIconQuery.graphql';

type HomeIconProps = {
  webCardId: string;
};

const HomeCoverIcon = ({ webCardId }: HomeIconProps) => {
  const data = useLazyLoadQuery<HomeIconQuery>(
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
    { fetchPolicy: 'store-and-network' }, //store only does not work when killing app on launch
  );

  return <CoverRenderer webCard={data.node} width={COVER_WIDTH} />;
};

export const HomeIcon = () => {
  const { profileInfos } = useAuthState();
  if (!profileInfos?.webCardId) {
    return null;
  }

  return (
    <Suspense fallback={<CoverRenderer width={COVER_WIDTH} webCard={null} />}>
      <HomeCoverIcon webCardId={profileInfos.webCardId} />
    </Suspense>
  );
};

const COVER_WIDTH = 18;
