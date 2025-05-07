import { NextResponse } from 'next/server';
import { AZZAPP_URL_WEBSITE } from '@azzapp/shared/urlHelpers';
import env from '#env';
import { getDeviceInfo } from '#helpers/devices';

const iosApp = env.NEXT_PUBLIC_DOWNLOAD_IOS_APP;
const androidApp = env.NEXT_PUBLIC_DOWNLOAD_ANDROID_APP;
const azzappWebsite = AZZAPP_URL_WEBSITE;

const invite = async (req: Request) => {
  const { isAndroid, isIos } = getDeviceInfo(req);

  if (isIos && iosApp) {
    return NextResponse.redirect(iosApp);
  }

  if (isAndroid && androidApp) {
    return NextResponse.redirect(androidApp);
  }

  if (azzappWebsite) {
    return NextResponse.redirect(azzappWebsite);
  } else {
    return NextResponse.next({
      status: 404,
      statusText: 'Not Found',
    });
  }
};

export { invite as GET };
