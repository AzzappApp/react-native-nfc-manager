import { useCallback, useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { useProfileInfos } from './authStateHooks';
import type { useSetRevenueCatUserInfoQuery } from '#relayArtifacts/useSetRevenueCatUserInfoQuery.graphql';
const setRevenueCatUserInfoQuery = graphql`
  query useSetRevenueCatUserInfoQuery {
    currentUser {
      id
      email
      phoneNumber
    }
  }
`;

export function useSetRevenueCatUserInfo() {
  const { currentUser } = useLazyLoadQuery<useSetRevenueCatUserInfoQuery>(
    setRevenueCatUserInfoQuery,
    {},
    { fetchPolicy: 'store-and-network' },
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
