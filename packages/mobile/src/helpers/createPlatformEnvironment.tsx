import * as WebAPI from '@azzapp/shared/lib/WebAPI';
import { Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Link from '../components/Link';
import fetchWithRefreshToken, { injectToken } from './fetchWithRefreshToken';
import { getTokens } from './tokensStore';
import type { NativeRouter } from '../components/NativeRouter';
import type { PlatformEnvironment } from '@azzapp/app/lib/PlatformEnvironment';

const createPlatformEnvironment = (
  router: NativeRouter,
): PlatformEnvironment => ({
  router,
  LinkComponent: Link,
  async launchImagePicker() {
    const { didCancel, errorCode, assets } = await launchImageLibrary({
      quality: 0.3,
      videoQuality: Platform.select({ ios: 'medium', default: 'low' }),
      mediaType: 'mixed',
    });
    const photo = assets?.[0];
    return {
      didCancel,
      error: errorCode ? new Error(errorCode) : undefined,
      uri: photo?.uri,
      file:
        photo &&
        ({
          name: photo.fileName,
          type: photo.type,
          uri:
            Platform.OS === 'ios'
              ? photo.uri?.replace('file://', '')
              : photo.uri,
        } as any),
    };
  },
  WebAPI: {
    logout: (_, init) =>
      WebAPI.logout(_, injectToken(getTokens()?.token, init as RequestInit)),
    signin: (params: WebAPI.SignInParams) =>
      WebAPI.signin({ ...params, authMethod: 'token' }),
    signup: (params: WebAPI.SignUpParams) =>
      WebAPI.signup({ ...params, authMethod: 'token' }),
    refreshTokens: WebAPI.refreshTokens,
    uploadMedia: WebAPI.uploadMedia,
    uploadSign: (params, init) =>
      WebAPI.uploadSign(params, {
        ...init,
        fetchFunction: fetchWithRefreshToken,
      }),
  },
});

export default createPlatformEnvironment;
