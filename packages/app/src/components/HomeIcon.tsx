import { Suspense, useEffect, useState } from 'react';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { addGlobalEventListener } from '#helpers/globalEvents';
import { useProfileInfos } from '#hooks/authStateHooks';
import CoverRenderer from './CoverRenderer';
import type { HomeIconQuery } from '#relayArtifacts/HomeIconQuery.graphql';

type HomeIconProps = {
  webCardId: string;
};

const HomeCoverIcon = ({ webCardId }: HomeIconProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    addGlobalEventListener('READY', () => {
      setReady(true);
    });
  }, []);

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
    {
      fetchKey: `home-icon-ready-${ready}`,
      fetchPolicy: 'store-only',
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
