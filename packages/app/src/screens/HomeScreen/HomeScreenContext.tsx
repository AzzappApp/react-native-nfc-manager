import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { useScreenHasFocus } from '#components/NativeRouter';
import { getAuthState, onChangeWebCard } from '#helpers/authStore';
import type { HomeScreenContext_user$key } from '#relayArtifacts/HomeScreenContext_user.graphql';
import type { MutableRefObject, ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

type HomeScreenContextType = {
  currentIndexSharedValue: SharedValue<number>;
  currentIndexProfileSharedValue: SharedValue<number>;
  onCurrentProfileIndexChange: (index: number) => void;
  initialProfileIndex: number;
  scrollToIndex: MutableRefObject<(index: number, animated?: boolean) => void>;
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

  //updating the initialProfileIndex to avoid warning(not sure needed in production)
  useEffect(() => {
    if (user?.profiles && user?.profiles?.length < initialProfileIndex) {
      setInitialProfileIndex(1);
    }
  }, [initialProfileIndex, user?.profiles]);

  const currentIndexSharedValue = useSharedValue(initialProfileIndex);
  const currentIndexProfileSharedValue = useDerivedValue(() => {
    return Math.round(currentIndexSharedValue.value);
  }, [currentIndexSharedValue]);

  const profilesRef = useRef(user.profiles);
  const focus = useScreenHasFocus();
  useEffect(() => {
    const currentProfileId = getAuthState().profileInfos?.profileId;

    if (
      focus &&
      user?.profiles &&
      profilesRef.current &&
      user?.profiles?.length !== profilesRef.current.length
    ) {
      let newProfile = user?.profiles?.find(
        profile => profile.id === currentProfileId,
      );
      if (!newProfile) newProfile = user.profiles?.[0];

      const newProfileIndex = user?.profiles?.findIndex(
        profile => profile.id === newProfile.id,
      );

      setTimeout(() => {
        // we need to wait for a render in case of new
        // profile added, scroll doesn't work as new card may not be added
        scrollToIndex.current(newProfileIndex + 1);
      });
      if (newProfile?.webCard?.id) {
        onChangeWebCard({
          profileId: newProfile.id,
          webCardId: newProfile.webCard.id,
          profileRole: newProfile.invited ? 'invited' : newProfile.profileRole,
        });
      }
    }
    profilesRef.current = user.profiles;
  }, [focus, user.profiles]);

  useEffect(() => {
    if (!user.profiles?.length) {
      onChangeWebCard(null);
    }
  }, [user.profiles?.length]);

  const onCurrentProfileIndexChange = useCallback(
    (index: number) => {
      const newProfile = user.profiles?.[index - 1];
      if (newProfile) {
        onChangeWebCard({
          profileId: newProfile.id,
          webCardId: newProfile.webCard?.id ?? null,
          profileRole: newProfile.invited ? 'invited' : newProfile.profileRole,
        });
      }
    },
    [user.profiles],
  );

  const scrollToIndex = useRef((_index: number, _animated?: boolean) => {});

  const value = useMemo(
    () => ({
      currentIndexSharedValue,
      initialProfileIndex,
      currentIndexProfileSharedValue,
      onCurrentProfileIndexChange,
      scrollToIndex,
    }),
    [
      currentIndexProfileSharedValue,
      currentIndexSharedValue,
      initialProfileIndex,
      onCurrentProfileIndexChange,
      scrollToIndex,
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
