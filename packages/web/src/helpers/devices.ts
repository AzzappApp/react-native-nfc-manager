export const DESKTOP_WIDTH = 750;

export type DeviceInfo = {
  isMobileDevice: boolean;
  isIos: boolean;
  isAndroid: boolean;
};

/*
 * return an object representing device type
 * accepted props: Request or a string containing the user agent
 */
export const getDeviceInfo = (req: Request | string | null): DeviceInfo => {
  let _userAgent = '';
  if (req == null) {
    return { isMobileDevice: false, isIos: false, isAndroid: false };
  } else if (typeof req === 'string') {
    _userAgent = req;
  } else {
    _userAgent = req.headers.get('user-agent') || '';
  }
  const isIos = /iPad|iPhone/.test(_userAgent);
  const isAndroid = /Android/.test(_userAgent);
  return { isMobileDevice: isIos || isAndroid, isIos, isAndroid };
};
