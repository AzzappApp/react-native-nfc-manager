import { Suspense } from 'react';
import { graphql, useLazyLoadQuery } from 'react-relay';
import WebCardBoundRelayEnvironmentProvider from '#helpers/WebCardBoundRelayEnvironmentProvider';
import useAuthState from '#hooks/useAuthState';
import CoverRenderer from './CoverRenderer';
import type { HomeIconQuery } from '@azzapp/relay/artifacts/HomeIconQuery.graphql';

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
    { fetchPolicy: 'store-only' },
  );

  return (
    <CoverRenderer
      webCard={data.node}
      width={COVER_WIDTH}
      style={{ marginBottom: -1 }}
    />
  );
};

export const HomeIcon = () => {
  const { webCardId } = useAuthState();

  return (
    <WebCardBoundRelayEnvironmentProvider webCardId={webCardId}>
      <Suspense fallback={<CoverRenderer width={COVER_WIDTH} webCard={null} />}>
        {webCardId && <HomeCoverIcon webCardId={webCardId} />}
      </Suspense>
    </WebCardBoundRelayEnvironmentProvider>
  );
};

const COVER_WIDTH = 18;
