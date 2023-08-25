import { graphql } from 'graphql';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { createGraphQLContext, schema } from '@azzapp/data';
import { getProfileById } from '@azzapp/data/domains';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import queryMap from '@azzapp/relay/query-map.json';
import ERRORS from '@azzapp/shared/errors';
import { getSessionData } from '#helpers/tokens';
import type { SessionData } from '#helpers/tokens';
import type { Profile } from '@azzapp/data/domains';
import type { NextRequest } from 'next/server';

export const POST = async (req: NextRequest) => {
  let sessionData: SessionData | null;
  try {
    sessionData = await getSessionData();
  } catch (e) {
    if (e instanceof Error && e.message === ERRORS.INVALID_TOKEN) {
      return NextResponse.json(
        { message: ERRORS.INVALID_TOKEN },
        { status: 401 },
      );
    } else {
      return NextResponse.json(
        { message: ERRORS.INVALID_REQUEST },
        { status: 400 },
      );
    }
  }

  const requestParams = await req.json();
  const { profileId, locale } = requestParams;
  let profile: Profile | null = null;
  if (profileId) {
    profile = await getProfileById(profileId);
    if (!profile || profile.userId !== sessionData?.userId) {
      return NextResponse.json(
        { message: ERRORS.UNAUTORIZED },
        { status: 401 },
      );
    }
  }

  const cardUsernamesToRevalidate = new Set<string>();

  const cardUpdateListener = (username: string) => {
    cardUsernamesToRevalidate.add(username);
  };

  try {
    const result = await graphql({
      schema,
      rootValue: {},
      source: requestParams.id
        ? (queryMap as any)[requestParams.id]
        : requestParams.query,
      variableValues: requestParams.variables,
      contextValue: createGraphQLContext(
        cardUpdateListener,
        sessionData?.userId,
        profile,
        locale ?? DEFAULT_LOCALE,
      ),
    });
    if (
      (process.env.NODE_ENV !== 'production' ||
        process.env.DEPLOYMENT_ENVIRONMENT === 'development') &&
      !!result.errors?.length
    ) {
      console.warn('GraphQL errors:');
      console.warn(result.errors);
      console.warn(result.errors[0].stack);
    }

    cardUsernamesToRevalidate.forEach(username => {
      revalidateTag(username);
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
};
