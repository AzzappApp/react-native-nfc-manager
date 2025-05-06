import { Suspense, useEffect, useState } from 'react';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { createId } from '#helpers/idHelpers';
import { useProfileInfos } from '#hooks/authStateHooks';
import { HOME_ICON_COVER_WIDTH } from './constants';
import CoverRenderer from './CoverRenderer';
import type { HomeIconQuery } from '#relayArtifacts/HomeIconQuery.graphql';

type HomeIconProps = {
  webCardId: string;
};

const forceRefreshListeners = new Set<() => void>();
const forceRefresh = () => {
  forceRefreshListeners.forEach(listener => listener());
};

const HomeCoverIcon = ({ webCardId }: HomeIconProps) => {
  const [fetchKey, setFetchKey] = useState(createId());
  const data = useLazyLoadQuery<HomeIconQuery>(
    graphql`
      query HomeIconQuery($webCardId: ID!) {
        node(id: $webCardId) {
          ...CoverRenderer_webCard @alias(as: "webCard")
        }
      }
    `,
    {
      webCardId,
    },
    {
      fetchKey,
      fetchPolicy: 'store-only',
    },
  );

  useEffect(() => {
    forceRefreshListeners.add(() => {
      setFetchKey(createId());
    });
  }, []);

  return (
    <CoverRenderer
      webCard={data.node?.webCard}
      width={HOME_ICON_COVER_WIDTH}
      canPlay={false}
    />
  );
};

export const HomeIcon = () => {
  const profileInfos = useProfileInfos();

  if (!profileInfos?.webCardId) {
    return <CoverRenderer width={HOME_ICON_COVER_WIDTH} webCard={null} />;
  }

  return (
    <Suspense
      fallback={<CoverRenderer width={HOME_ICON_COVER_WIDTH} webCard={null} />}
    >
      <HomeCoverIcon webCardId={profileInfos.webCardId} />
    </Suspense>
  );
};

HomeIcon.forceRefresh = forceRefresh;
