import { NextResponse } from 'next/server';
import {
  addPassRegistration,
  deletePassRegistration,
  getPassRegistration,
} from '@azzapp/data';
import { checkAuthorization } from '#helpers/pass/apple';
import { withPluginsRoute } from '#helpers/queries';

const registerDevice = async (
  req: Request,
  {
    params,
  }: {
    params: {
      serial: string;
      lang: string;
      deviceIdentifier: string;
      passTypeIdentifier: string;
    };
  },
) => {
  try {
    await checkAuthorization(req, params.serial);
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { pushToken } = await req.json();

  if (!pushToken) {
    return NextResponse.json({ error: 'Push token missing' }, { status: 400 });
  }

  const found = await getPassRegistration(
    params.deviceIdentifier,
    params.passTypeIdentifier,
    params.serial,
  );

  if (found && found.pushToken === pushToken) {
    return NextResponse.json(
      { message: 'Device already registered' },
      { status: 200 },
    );
  }

  await addPassRegistration({
    deviceIdentifier: params.deviceIdentifier,
    passTypeIdentifier: params.passTypeIdentifier,
    serial: params.serial,
    createdAt: new Date(),
    pushToken,
  });

  return NextResponse.json({ message: 'Device registered' }, { status: 201 });
};

const unregisterDevice = async (
  req: Request,
  {
    params,
  }: {
    params: {
      serial: string;
      lang: string;
      deviceIdentifier: string;
      passTypeIdentifier: string;
    };
  },
) => {
  try {
    await checkAuthorization(req, params.serial);
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await deletePassRegistration(
    params.deviceIdentifier,
    params.passTypeIdentifier,
    params.serial,
  );

  return NextResponse.json({ message: 'Device unregistered' }, { status: 200 });
};

export const { POST, DELETE } = {
  POST: withPluginsRoute(registerDevice),
  DELETE: withPluginsRoute(unregisterDevice),
};
