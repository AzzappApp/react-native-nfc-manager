import { NextResponse } from 'next/server';
import {
  getSerialsForDevice,
  getAppleWalletSerialsOfUpdateProfiles,
} from '@azzapp/data';
import { withPluginsRoute } from '#helpers/queries';
import type { NextRequest } from 'next/server';

const getUpdatedPasses = async (
  req: NextRequest,
  {
    params,
  }: {
    params: {
      deviceIdentifier: string;
      passTypeIdentifier: string;
    };
  },
) => {
  const passes = await getSerialsForDevice(
    params.deviceIdentifier,
    params.passTypeIdentifier,
  );

  if (passes.length === 0) {
    return new Response(null, {
      status: 204, //204 is not supported by NextResponse
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const searchParams = req.nextUrl.searchParams;

  const passesUpdatedSince = searchParams.get('passesUpdatedSince');

  const passesUpdatedDate = passesUpdatedSince
    ? new Date(passesUpdatedSince)
    : undefined;

  const lastUpdated = new Date();

  const serials = await getAppleWalletSerialsOfUpdateProfiles(
    passes.map(pass => pass.serial),
    passesUpdatedDate,
  );

  if (serials.length === 0) {
    return new Response(null, {
      status: 204, //204 is not supported by NextResponse
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  return NextResponse.json(
    {
      serialNumbers: serials,
      lastUpdated: lastUpdated.toISOString(),
    },
    {
      status: 200,
    },
  );
};

export const { GET } = {
  GET: withPluginsRoute(getUpdatedPasses),
};
