import {
  FollowTable,
  ProfileTable,
  UserTable,
  WebCardTable,
  db,
} from '@azzapp/data';
import { generateTokens } from '@azzapp/web/src/helpers/tokens';
import type { Follow, Profile, User, WebCard } from '@azzapp/data';

type ExecutorProps = {
  query: string;
  variables: string;
  extensions?: {
    headers?: {
      authorization: string;
    };
  };
};

export const createAppFixture = () => {
  const executor = async (args: ExecutorProps) => {
    const body = JSON.stringify({
      query: args.query,
      variables: args.variables,
    });

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (args.extensions?.headers?.authorization) {
      Object.assign(headers, {
        authorization: `Bearer ${args.extensions.headers.authorization}`,
      });
    }

    try {
      const res = await fetch('http://localhost:3000/api/graphql', {
        method: 'POST',
        headers,
        body,
      }).then(response => response.json());

      return res;
    } catch (e) {
      console.log({ e });
    }
  };

  return {
    executor,
    load: (fixtures: Fixtures) => {
      loadFixtures(fixtures);
    },
    generateTokens,
  };
};

export type Fixtures = {
  webCard?: WebCard[];
  user?: User[];
  profile?: Profile[];
  follow?: Follow[];
};

export const loadFixtures = async (fixtures: Fixtures) => {
  // Dangerous while we work on the same branch (and it's not protected)
  // await drizzleService.client.delete(UserTable).execute();
  // await drizzleService.client.delete(ProfileTable).execute();
  // await drizzleService.client.delete(WebCardTable).execute();
  // await drizzleService.client.delete(FollowTable).execute();

  if (fixtures.user) {
    await Promise.all(
      fixtures.user.map(user => db.client().insert(UserTable).values(user)),
    );
  }

  if (fixtures.profile) {
    await Promise.all(
      fixtures.profile.map(profile =>
        db.client().insert(ProfileTable).values(profile),
      ),
    );
  }

  if (fixtures.webCard) {
    await Promise.all(
      fixtures.webCard.map(webCard =>
        db.client().insert(WebCardTable).values(webCard),
      ),
    );
  }

  if (fixtures.follow) {
    await Promise.all(
      fixtures.follow.map(follow =>
        db.client().insert(FollowTable).values(follow),
      ),
    );
  }
};
