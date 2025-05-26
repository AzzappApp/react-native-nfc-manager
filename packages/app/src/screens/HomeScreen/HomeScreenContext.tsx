import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useDerivedValue,
  useSharedValue,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { colors } from '#theme';
import { getAuthState, onChangeWebCard } from '#helpers/authStore';
import type { HomeScreenContext_user$key } from '#relayArtifacts/HomeScreenContext_user.graphql';
import type { ReactNode } from 'react';
import type { DerivedValue, SharedValue } from 'react-native-reanimated';

type HomeScreenContextType = {
  currentIndexSharedValue: SharedValue<number>;
  currentIndexProfileSharedValue: SharedValue<number>;
  onCurrentProfileIndexChange: (index: number) => void;
  initialProfileIndex: number;
  bottomContentOpacity: SharedValue<number>;
  readableTextColor: DerivedValue<string>;
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
          promotedAsOwner
          webCard {
            id
            userName
            cardIsPublished
            coverIsPredefined
            hasCover
            cardColors {
              primary
            }
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
          profileRole: newProfile.profileRole,
          invited: newProfile.invited,
          webCardUserName: newProfile.webCard?.userName ?? null,
          cardIsPublished: newProfile.webCard?.cardIsPublished,
          coverIsPredefined: newProfile.webCard?.coverIsPredefined,
        });
      }
    },
    [user.profiles],
  );

  const bottomVisibleValues = useMemo(() => {
    return [
      0,
      ...(user.profiles?.map(profile => {
        if (!profile) return 0;
        const webCard = profile.webCard as {
          hasCover?: boolean;
          cardIsPublished?: boolean;
        } | null;
        return webCard?.hasCover &&
          webCard?.cardIsPublished &&
          !profile.invited &&
          !(profile as { promotedAsOwner?: boolean }).promotedAsOwner
          ? 1
          : 0;
      }) ?? []),
      0,
    ];
  }, [user.profiles]);

  const readableColors = useMemo<string[]>(() => {
    return [
      colors.white,
      ...(user.profiles?.map(profile => {
        if (!profile?.webCard?.cardColors) return colors.white;
        return profile?.webCard?.cardColors?.primary
          ? getTextColor(profile?.webCard.cardColors?.primary)
          : colors.white;
      }) ?? []),
    ];
  }, [user.profiles]);

  const bottomContentOpacity = useDerivedValue(() => {
    const index = currentIndexSharedValue.value;
    const current = Math.round(index);
    const prev = Math.max(0, current - 1);
    const next = Math.min(bottomVisibleValues.length - 1, current + 1);

    return interpolate(
      currentIndexSharedValue.value,
      [prev, current, next],
      [
        bottomVisibleValues[prev] ?? 0,
        bottomVisibleValues[current] ?? 0,
        bottomVisibleValues[next] ?? 0,
      ],
    );
  }, [currentIndexSharedValue, bottomVisibleValues]);

  const readableTextColor = useDerivedValue(() => {
    const index = currentIndexSharedValue.value;
    const current = Math.round(index);
    const prev = Math.max(0, current - 1);
    const next = Math.min(readableColors.length - 1, current + 1);

    return interpolateColor(
      currentIndexSharedValue.value,
      [prev, current, next],
      [readableColors[prev], readableColors[current], readableColors[next]],
    );
  }, [currentIndexSharedValue, readableColors]);

  const value = useMemo(
    () => ({
      currentIndexSharedValue,
      initialProfileIndex,
      currentIndexProfileSharedValue,
      onCurrentProfileIndexChange,
      bottomContentOpacity,
      readableTextColor,
    }),
    [
      currentIndexProfileSharedValue,
      currentIndexSharedValue,
      initialProfileIndex,
      onCurrentProfileIndexChange,
      bottomContentOpacity,
      readableTextColor,
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
