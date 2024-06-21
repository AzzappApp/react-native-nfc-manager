import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import {
  useRouteWillChange,
  useScreenHasFocus,
} from '#components/NativeRouter';
import {
  addAuthStateListener,
  getAuthState,
  onChangeWebCard,
} from '#helpers/authStore';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import { usePrefetchRoute } from '#helpers/ScreenPrefetcher';
import type { HomeScreenContext_user$key } from '#relayArtifacts/HomeScreenContext_user.graphql';
import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { Disposable } from 'react-relay';

type HomeScreenContextType = {
  currentIndexSharedValue: SharedValue<number>;
  inputRange: number[];
  currentIndexProfile: SharedValue<number>;
  onCurrentProfileIndexChange: (index: number) => void;
  initialProfileIndex: number;
};

const HomeScreenContext = React.createContext<
  HomeScreenContextType | undefined
>(undefined);

type HomeScreenProviderProps = {
  children: ReactNode;
  userKey: HomeScreenContext_user$key;
};
export const HomeScreenProvider = ({
  children,
  userKey,
}: HomeScreenProviderProps) => {
  const user = useFragment(
    graphql`
      fragment HomeScreenContext_user on User {
        profiles {
          id
          profileRole
          invited
          webCard {
            id
            userName
          }
        }
      }
    `,
    userKey,
  );
  const [initialProfileIndex, setInitialProfileIndex] = useState(() => {
    const index = user?.profiles?.findIndex(
      profile => profile.id === getAuthState().profileInfos?.profileId,
    );

    return index !== undefined && index !== -1 ? index + 1 : 0;
  });

  const currentIndexSharedValue = useSharedValue(initialProfileIndex);

  const currentIndexProfile = useDerivedValue(() => {
    return Math.round(currentIndexSharedValue.value);
  }, [currentIndexSharedValue.value]);

  const inputRange = useMemo(
    () => [0, ...(user?.profiles?.map((_, index) => index + 1) ?? [])],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.profiles?.length],
  );
  //wondering if we really need this. Force to a fix number when HOME change
  useRouteWillChange('HOME', () => {
    if (currentIndexProfile.value !== currentIndexSharedValue.value)
      currentIndexSharedValue.value = currentIndexProfile.value;
  });

  // #region prefetch
  //TODO: have a reflexion on the validity of prefetching, is it really usefull. user can scroll to see thir profile without openit
  // doing request we don't need on each change
  const prefetchRoute = usePrefetchRoute();

  useEffect(() => {
    let disposable: Disposable | undefined;
    if (currentIndexProfile.value === 0) {
      disposable = prefetchRoute(getRelayEnvironment(), {
        route: 'WEBCARD_KIND_SELECTION',
      });
    }
    return () => {
      disposable?.dispose();
    };
  }, [currentIndexProfile, prefetchRoute]);

  // we need to keep a ref to the profiles to avoid prefetching when the user `profiles` field changes
  const profilesRef = useRef(user.profiles);

  const focus = useScreenHasFocus();

  useEffect(() => {
    //in case we are deleting a profile from another menu (cover edition for example,we should update profile even if not focus)
    //if you still have issue, we can do it in the deleteWecard mutation
    if (
      focus &&
      user?.profiles &&
      profilesRef.current &&
      user?.profiles?.length < profilesRef.current.length
    ) {
      const newProfile = user.profiles?.[0];
      if (newProfile) {
        onChangeWebCard({
          profileId: newProfile.id,
          webCardId: newProfile.webCard.id,
          profileRole: newProfile.invited ? 'invited' : newProfile.profileRole,
        });
      }
    }
    profilesRef.current = user.profiles;
  }, [focus, user.profiles]);

  const profilesDisposables = useRef<Disposable[]>([]).current;
  useEffect(() => {
    const dispose = addAuthStateListener(({ profileInfos }) => {
      if (profileInfos) {
        const profile = profilesRef.current?.find(
          profile => profile.id === profileInfos.profileId,
        );
        if (profile) {
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
    });
    return dispose;
  }, [profilesDisposables, prefetchRoute]);

  useEffect(
    () => () => {
      profilesDisposables.forEach(disposable => disposable.dispose());
      profilesDisposables.length = 0;
    },
    [profilesDisposables],
  );
  // #endregion
  useEffect(() => {
    if (user.profiles?.length === 0) {
      onChangeWebCard({ profileId: '', webCardId: '', profileRole: '' });
    }
  }, [user.profiles, user.profiles?.length]);

  const onCurrentProfileIndexChange = useCallback(
    (index: number) => {
      'worklet';
      currentIndexSharedValue.value = index;
      const newProfile = user.profiles?.[index - 1];
      if (newProfile) {
        if (focus) {
          onChangeWebCard({
            profileId: newProfile.id,
            webCardId: newProfile.webCard.id,
            profileRole: newProfile.invited
              ? 'invited'
              : newProfile.profileRole,
          });
        }
      }
    },
    [currentIndexSharedValue, focus, user.profiles],
  );

  //updating the initialProfileIndex to avoid warning(not sure needed in production)
  useEffect(() => {
    if (user?.profiles && user?.profiles?.length > initialProfileIndex) {
      setInitialProfileIndex(1);
    }
  }, [initialProfileIndex, onCurrentProfileIndexChange, user?.profiles]);

  return (
    <HomeScreenContext.Provider
      value={{
        currentIndexSharedValue,
        inputRange,
        initialProfileIndex,
        currentIndexProfile,
        onCurrentProfileIndexChange,
      }}
    >
      {children}
    </HomeScreenContext.Provider>
  );
};

export const useHomeScreenContext = () => {
  const context = React.useContext(HomeScreenContext);
  if (context === undefined) {
    throw new Error(
      'useHomeScreenContext must be used within a HomeScreenProvider',
    );
  }
  return context;
};

export const useHomeScreenInputProfileRange = () => {
  const context = React.useContext(HomeScreenContext);
  if (context === undefined) {
    throw new Error(
      'useHomeScreenContext must be used within a HomeScreenProvider',
    );
  }
  return context.inputRange;
};

export const useHomeScreenCurrentIndex = () => {
  const context = React.useContext(HomeScreenContext);
  if (context === undefined) {
    return null;
  }
  return context.currentIndexSharedValue;
};
