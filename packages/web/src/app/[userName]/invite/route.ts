import { NextResponse } from 'next/server';
import cors from '#helpers/cors';
import { withPluginsRoute } from '#helpers/queries';

const iosApp = process.env.NEXT_PUBLIC_DOWNLOAD_IOS_APP;
const androidApp = process.env.NEXT_PUBLIC_DOWNLOAD_ANDROID_APP;
const azzappWebsite = process.env.NEXT_PUBLIC_AZZAPP_WEBSITE;

const invite = async (req: Request) => {
  const userAgent = req.headers.get('user-agent') || '';

  const ios = /iPad|iPhone/.test(userAgent);
  const android = /Android/.test(userAgent);

  if (ios && iosApp) {
    return NextResponse.redirect(iosApp);
  }

  if (android && androidApp) {
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

export const { GET, OPTIONS } = cors({ GET: withPluginsRoute(invite) });
