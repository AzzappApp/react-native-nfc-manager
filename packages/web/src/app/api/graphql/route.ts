import * as Sentry from '@sentry/nextjs';
import { graphql } from 'graphql';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { compare } from 'semver';
import { createGraphQLContext, schema } from '@azzapp/data';
import { getProfileById } from '@azzapp/data/domains';
import {
  getDatabaseConnectionsInfos,
  startDatabaseConnectionMonitoring,
} from '@azzapp/data/domains/databaseMonitorer';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import queryMap from '@azzapp/relay/query-map.json';
import ERRORS from '@azzapp/shared/errors';
import { getSessionData } from '#helpers/tokens';
import packageJSON from '../../../../package.json';
import type { SessionData } from '#helpers/tokens';
import type { Profile } from '@azzapp/data/domains';
import type { NextRequest } from 'next/server';

const LAST_SUPPORTED_APP_VERSION =
  process.env.LAST_SUPPORTED_APP_VERSION ?? packageJSON.version;

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

  if (process.env.ENABLE_DATABASE_MONITORING === 'true') {
    startDatabaseConnectionMonitoring();
  }

  const requestParams = await req.json();
  const { profileId, locale, appVersion } = requestParams;

  if (appVersion && compare(appVersion, LAST_SUPPORTED_APP_VERSION) < 0) {
    return NextResponse.json(
      { message: ERRORS.UPDATE_APP_VERSION },
      { status: 400 },
    );
  }

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
    const graphqlRequest = requestParams.id
      ? (queryMap as any)[requestParams.id]
      : requestParams.query;

    const result = await graphql({
      schema,
      rootValue: {},
      source: graphqlRequest,
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
      console.info(`Revalidating webcard for user ${username}`);
      revalidateTag(username);
    });
    if (process.env.ENABLE_DATABASE_MONITORING === 'true') {
      const infos = await getDatabaseConnectionsInfos();
      if (infos) {
        const gqlName = /query\s*(\S+)\s*[{(]/g.exec(graphqlRequest)?.[1];
        console.log(
          `-------------------- Graphql Query : ${gqlName}--------------------`,
        );
        console.log('Number database requests', infos.nbRequests);
        console.log('Max concurrent requests', infos.maxConcurrentRequests);
        console.log('Queries:\n---\n', infos.queries.join('\n---\n'));
        console.log(
          '----------------------------------------------------------------',
        );
      }
    }
    const environment = process.env.NEXT_PUBLIC_PLATFORM || 'development';
    if (environment !== 'production') {
      Sentry.captureException(result.errors);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
};
