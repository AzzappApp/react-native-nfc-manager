import { graphql } from 'graphql';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getSessionData } from '@azzapp/auth/viewer';
import { createGraphQLContext, schema } from '@azzapp/data';
import queryMap from '@azzapp/relay/query-map.json';
import ERRORS from '@azzapp/shared/errors';
import type { SessionData } from '@azzapp/auth/viewer';
import type { NextRequest } from 'next/server';

export const POST = async (req: NextRequest) => {
  let viewerInfos: SessionData;
  try {
    viewerInfos = await getSessionData();
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

  const cardUsernamesToRevalidate = new Set<string>();

  const cardUpdateListener = (username: string) => {
    cardUsernamesToRevalidate.add(username);
  };

  const requestParams = await req.json();
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
        viewerInfos,
        undefined,
      ),
    });
    if (process.env.NODE_ENV !== 'production' && result.errors) {
      console.warn(result.errors);
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
