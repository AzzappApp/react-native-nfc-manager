import { memo, useEffect, useRef } from 'react';
import { graphql, useFragment } from 'react-relay';
import { addAuthStateListener } from '#helpers/authStore';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeScreenPrefetcher_user$key } from '#relayArtifacts/HomeScreenPrefetcher_user.graphql';
import type { Disposable } from 'react-relay';

export type HomeScreenPrefetcherProps = {
  user: HomeScreenPrefetcher_user$key;
};

const HomeScreenPrefetcher = ({ user: userKey }: HomeScreenPrefetcherProps) => {
  const user = useFragment(
    graphql`
      fragment HomeScreenPrefetcher_user on User {
        profiles {
          id
          webCard {
            userName
          }
        }
      }
    `,
    userKey,
  );

  const { currentIndexProfileSharedValue } = useHomeScreenContext();

  const prefetchRoute = usePrefetchRoute();
  useEffect(() => {
    let disposable: Disposable | undefined;
    const timeout = setTimeout(() => {
      if (currentIndexProfileSharedValue.get() === 0) {
        disposable = prefetchRoute(getRelayEnvironment(), {
          route: 'WEBCARD_KIND_SELECTION',
        });
      }
    }, PREFETCH_DELAY);
    return () => {
      disposable?.dispose();
      clearTimeout(timeout);
    };
  }, [currentIndexProfileSharedValue, prefetchRoute]);

  const profilesRef = useRef(user.profiles);
  useEffect(() => {
    profilesRef.current = user.profiles;
  }, [user.profiles]);

  const profilesDisposables = useRef<Disposable[]>([]).current;
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const dispose = addAuthStateListener(({ profileInfos }) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (profileInfos?.webCardId) {
          const profile = profilesRef.current?.find(
            profile => profile.id === profileInfos.profileId,
          );
          if (profile?.webCard) {
            const environment = getRelayEnvironment();
            profilesDisposables.push(
              prefetchRoute(environment, {
                route: 'WEBCARD',
                params: {
                  webCardId: profileInfos.webCardId,
                  userName: profile.webCard.userName,
                },
              }),
              prefetchRoute(environment, {
                route: 'CONTACT_CARD',
              }),
            );
          }
        }
      }, PREFETCH_DELAY);
    });
    return () => {
      dispose();
      clearTimeout(timeout);
    };
  }, [profilesDisposables, prefetchRoute]);

  useEffect(
    () => () => {
      profilesDisposables.forEach(disposable => disposable.dispose());
      profilesDisposables.length = 0;
    },
    [profilesDisposables],
  );
  return null;
};

const PREFETCH_DELAY = 500;

export default memo(HomeScreenPrefetcher);
