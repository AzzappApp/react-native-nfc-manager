import { NextResponse } from 'next/server';
import { getDeviceInfo } from '#helpers/devices';

const iosApp = process.env.NEXT_PUBLIC_DOWNLOAD_IOS_APP;
const androidApp = process.env.NEXT_PUBLIC_DOWNLOAD_ANDROID_APP;
const azzappWebsite = process.env.NEXT_PUBLIC_AZZAPP_WEBSITE;

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
