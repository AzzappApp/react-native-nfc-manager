import env from '#env';

export enum DeviceType {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  DESKTOP = 'DESKTOP',
}

export const isIos = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  return /iphone|ipad/.test(userAgent);
};

export const isAndroid = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  return /android/.test(userAgent);
};

export const getDeviceType = () => {
  if (isIos()) {
    return DeviceType.IOS;
  }
  if (isAndroid()) {
    return DeviceType.ANDROID;
  }

  return DeviceType.DESKTOP;
};

export const isAppClipSupported = () => {
  if (!env.NEXT_PUBLIC_APPLE_APP_ENABLED) {
    return false;
  }
  const userAgent = navigator.userAgent.toLowerCase();

  const isIOS = isIos();
  const iosVersionMatch = userAgent.match(/os (\d+)_/);
  const iosVersion = iosVersionMatch ? parseInt(iosVersionMatch[1], 10) : 0;
  return isIOS && iosVersion >= 16.4; //opening appclip from link only supported after 16.4, open from another app is supported from 17.0
};
