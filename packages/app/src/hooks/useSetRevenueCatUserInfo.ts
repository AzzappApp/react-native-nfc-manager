import { useCallback, useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { graphql, useFragment } from 'react-relay';
import { useProfileInfos } from './authStateHooks';
import type { useSetRevenueCatUserInfo_user$key } from '#relayArtifacts/useSetRevenueCatUserInfo_user.graphql';

export function useSetRevenueCatUserInfo(
  userKey: useSetRevenueCatUserInfo_user$key | null,
) {
  const currentUser = useFragment(
    graphql`
      fragment useSetRevenueCatUserInfo_user on User {
        id
        email
        phoneNumber
      }
    `,
    userKey,
  );

  const profileInfos = useProfileInfos();

  const setUserInfo = useCallback(async () => {
    const appUserId = await Purchases.getAppUserID();
    if (appUserId === profileInfos?.userId) {
      if (currentUser?.email !== null) {
        await Purchases.setEmail(currentUser!.email);
      }
      if (currentUser?.phoneNumber !== null) {
        await Purchases.setPhoneNumber(currentUser!.phoneNumber);
      }
    }
  }, [currentUser, profileInfos?.userId]);

  useEffect(() => {
    if (currentUser?.id === profileInfos?.userId) {
      setUserInfo();
    }
  }, [currentUser, profileInfos?.userId, setUserInfo]);
}
