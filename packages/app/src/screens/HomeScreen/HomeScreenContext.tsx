import { isEqual } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { getAuthState, onChangeWebCard } from '#helpers/authStore';
import { useProfileInfos } from '#hooks/authStateHooks';
import useLatestCallback from '#hooks/useLatestCallback';
import type { ProfileInfosInput } from '#helpers/authStore';
import type { HomeScreenContext_user$key } from '#relayArtifacts/HomeScreenContext_user.graphql';
import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

type HomeScreenContextType = {
  currentIndexSharedValue: SharedValue<number>;
  currentIndexProfileSharedValue: SharedValue<number>;
  onCurrentProfileIndexChange: (index: number) => void;
  initialProfileIndex: number;
};

const HomeScreenContext = React.createContext<
  HomeScreenContextType | undefined
>(undefined);

type HomeScreenProviderProps = {
  children: ReactNode;
  userKey: HomeScreenContext_user$key;
  onIndexChange: (index: number) => void;
};

export const HomeScreenProvider = ({
  children,
  onIndexChange,
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
            cardIsPublished
            coverIsPredefined
          }
        }
      }
    `,
    userKey,
  );

  const [initialProfileIndex, setInitialProfileIndex] = useState(() => {
    const index =
      user?.profiles?.length === 1
        ? 0
        : user?.profiles?.findIndex(
            profile => profile.id === getAuthState().profileInfos?.profileId,
          );
    return index !== undefined && index !== -1 ? index + 1 : 0;
  });

  //updating the initialProfileIndex to avoid warning(not sure needed in production)
  useEffect(() => {
    if (user?.profiles && user?.profiles?.length < initialProfileIndex) {
      setInitialProfileIndex(user?.profiles?.length ?? 0);
    }
  }, [initialProfileIndex, user?.profiles]);

  const currentIndexSharedValue = useSharedValue(initialProfileIndex);
  const currentIndexProfileSharedValue = useDerivedValue(() => {
    return Math.round(currentIndexSharedValue.value);
  }, [currentIndexSharedValue]);

  const currentProfile = useProfileInfos();
  const onIndexChangeLatest = useLatestCallback(onIndexChange);
  useEffect(() => {
    const nextProfileIndex = user.profiles?.findIndex(
      profile => profile.id === currentProfile?.profileId,
    );
    if (nextProfileIndex !== undefined && nextProfileIndex !== -1) {
      setTimeout(() => {
        if (nextProfileIndex + 1 !== currentIndexProfileSharedValue.value) {
          onIndexChangeLatest(nextProfileIndex + 1);
        }
      });
    }
  }, [
    currentIndexProfileSharedValue,
    currentProfile?.profileId,
    onIndexChangeLatest,
    user.profiles,
  ]);

  useEffect(() => {
    if (!user.profiles?.length) {
      onChangeWebCard(null);
    }
  }, [user.profiles?.length]);

  const onCurrentProfileIndexChange = useCallback(
    (index: number) => {
      const newProfile = user.profiles?.[index - 1];

      const profileInfos = getAuthState().profileInfos;
      if (newProfile) {
        const newData = {
          profileId: newProfile.id,
          webCardId: newProfile.webCard?.id ?? null,
          profileRole: newProfile.profileRole,
          invited: newProfile.invited,
          webCardUserName: newProfile.webCard?.userName ?? null,
          cardIsPublished: newProfile.webCard?.cardIsPublished,
          coverIsPredefined: newProfile.webCard?.coverIsPredefined,
        };

        let existingData: ProfileInfosInput | null = null;
        if (profileInfos) {
          const {
            profileId,
            webCardId,
            profileRole,
            invited,
            webCardUserName,
            cardIsPublished,
            coverIsPredefined,
          } = profileInfos;
          existingData = {
            profileId,
            webCardId,
            profileRole,
            invited,
            webCardUserName,
            cardIsPublished,
            coverIsPredefined,
          };
        }
        if (!isEqual(newData, existingData)) {
          onChangeWebCard(newData);
        }
      }
    },
    [user.profiles],
  );

  const value = useMemo(
    () => ({
      currentIndexSharedValue,
      initialProfileIndex,
      currentIndexProfileSharedValue,
      onCurrentProfileIndexChange,
    }),
    [
      currentIndexProfileSharedValue,
      currentIndexSharedValue,
      initialProfileIndex,
      onCurrentProfileIndexChange,
    ],
  );

  return (
    <HomeScreenContext.Provider value={value}>
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
