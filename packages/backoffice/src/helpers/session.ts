import { cookies, type UnsafeUnwrappedCookies } from 'next/headers';
import { seal, unseal } from '@azzapp/shared/crypto';
import env from '#env';
import type { NextResponse, NextRequest } from 'next/server';

const TTL = 15 * 24 * 3600;
const PASSWORD = env.SECRET_COOKIE_PASSWORD;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
} as const;
const COOKIE_NAME = 'azzapp-session';

// TODO we might want to add a session id system to be able to track sessions
type SessionData = {
  userId: string;
};

export const getRequestSession = async (req: NextRequest) => {
  const seal = req.cookies.get(COOKIE_NAME)?.value;
  if (!seal) {
    return null;
  }
  return unsealData(seal) as Promise<SessionData | null>;
};

export const getSession = async (): Promise<SessionData | null> => {
  const seal = (await cookies()).get(COOKIE_NAME)?.value;
  if (!seal) {
    return null;
  }
  return unsealData(seal) as Promise<SessionData | null>;
};

export const setSession = async (data: SessionData) => {
  (await cookies()).set({
    name: COOKIE_NAME,
    value: await sealData(data),
    maxAge: TTL,
    ...COOKIE_OPTIONS,
  });
};

export const destroySession = (res: NextResponse) => {
  res.cookies.delete(COOKIE_NAME);
  return res;
};

export const destroySessionServerActions = () => {
  (cookies() as unknown as UnsafeUnwrappedCookies).delete(COOKIE_NAME);
};

// version system to be able to recover old session data
const VERSION = '1';
const VERSION_DELIMITER = '~';

const sealData = async (data: SessionData) => {
  const res = await seal(data, PASSWORD, { ttl: TTL * 1000 });
  return `${res}${VERSION_DELIMITER}${VERSION}`;
};

const unsealData = async (seal: string) => {
  const { sealWithoutVersion } = parseSeal(seal);
  try {
    const data =
      (await unseal(sealWithoutVersion, PASSWORD, { ttl: TTL * 1000 })) ?? {};

    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'Expired seal' ||
        error.message === 'Bad hmac value' ||
        error.message.startsWith('Cannot find password: ') ||
        error.message === 'Incorrect number of sealed components'
      ) {
        // if seal expired or
        // if seal is not valid (encrypted using a different password, when passwords are badly rotated) or
        // if we can't find back the password in the seal
        // then we just start a new session over
        return null;
      }
    }
    throw error;
  }
};

function parseSeal(seal: string): {
  sealWithoutVersion: string;
  tokenVersion: number | null;
} {
  if (seal[seal.length - 2] === VERSION_DELIMITER) {
    const [sealWithoutVersion, tokenVersionAsString] =
      seal.split(VERSION_DELIMITER);
    return {
      sealWithoutVersion,
      tokenVersion: parseInt(tokenVersionAsString, 10),
    };
  }
  return { sealWithoutVersion: seal, tokenVersion: null };
}
