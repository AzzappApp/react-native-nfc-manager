import { useCallback, useEffect, useState } from 'react';
import { MMKV } from 'react-native-mmkv';

import { fetchQuery, graphql, useRelayEnvironment } from 'react-relay';
import { addOnTokenChangedListener } from '#helpers/tokensStore';
import { useAppState } from './useAppState';
import type { useAuthViewerQuery } from '@azzapp/relay/artifacts/useAuthViewerQuery.graphql';

// web implementation does not support  either id, encryption key, or path
// but still using it for RN faster storage possible
//https://github.com/mrousavy/react-native-mmkv/blob/master/src/createMMKV.web.ts
export const storage = new MMKV();

const MMKVS_KEY_AUTH = '@azzap/auth';
/**
 * Listening on token changed to determine if profile is still login or not
 * We keep the profileId stored for easy use in the app and now if it was already logged(not the token)
 * We also listen on app state change(active) to check if the profile is still login
 * We also listen on storage change to update the profileId
 *
 *
 * Warning : We need to handle the network error with caution
 *
 * @export
 * @return {*}
 */
export default function useAuth() {
  const appState = useAppState();
  const [profileID, setProfileID] = useState<string | undefined>(
    storage.getString(MMKVS_KEY_AUTH),
  );

  const environment = useRelayEnvironment();

  const isViewerValid = useCallback(() => {
    fetchQuery<useAuthViewerQuery>(
      environment,
      graphql`
        query useAuthViewerQuery {
          viewer {
            profile {
              id
              isReady
            }
          }
        }
      `,
      {},
    )
      .toPromise()
      .then(data => {
        if (data?.viewer?.profile?.id) {
          storage.set(MMKVS_KEY_AUTH, data.viewer.profile.id);
        } else {
          storage.delete(MMKVS_KEY_AUTH);
        }
      })
      .catch(error => {
        //TODO handle network error, should appear at this place
        console.log(error);
      });
  }, [environment]);

  useEffect(() => {
    if (appState === 'active') {
      setProfileID(storage.getString(MMKVS_KEY_AUTH));
      isViewerValid();
    }
  }, [appState, isViewerValid]);

  useEffect(() => {
    const listener = addOnTokenChangedListener(() => {
      isViewerValid();
    });

    return () => {
      listener.dispose();
    };
  }, [isViewerValid]);

  useEffect(() => {
    const listener = storage.addOnValueChangedListener(changedKey => {
      if (MMKVS_KEY_AUTH === changedKey) {
        setProfileID(storage.getString(MMKVS_KEY_AUTH));
      }
    });
    return () => {
      listener.remove();
    };
  }, []);

  return { authenticated: profileID != null, profileID };
}
