import { createGraphQLContext, graphQLSchema } from '@azzapp/data';
import ERRORS from '@azzapp/shared/lib/errors';
import { ApolloServer } from 'apollo-server-micro';
import Cors from 'cors';
import initMiddleware from '../../helpers/initMiddleware';
import {
  getRequestAuthInfos,
  withSessionAPIRoute,
} from '../../helpers/session';
import type { AuthInfos } from '../../helpers/session';
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

const cors = initMiddleware(
  // todo production security settings
  Cors(),
);

export const config = {
  api: {
    bodyParser: false,
  },
};

let handler: NextApiHandler | null;

const getServerHandler = async () => {
  if (handler == null) {
    const server = new ApolloServer({
      schema: graphQLSchema,
      context: ({ req }: { req: { authInfos: AuthInfos } }) =>
        createGraphQLContext(req.authInfos),
    });

    await server.start();

    handler = server.createHandler({ path: '/api/graphql' });
  }
  return handler;
};

void getServerHandler();

async function graphql(req: NextApiRequest, res: NextApiResponse) {
  await cors(req, res);

  const handler = await getServerHandler();
  if (req.method === 'OPTION') {
    res.status(200).end();
    return;
  }
  if (process.env.NODE_ENV !== 'production' && req.method === 'GET') {
    await handler(req, res);
  } else if (req.method === 'POST') {
    try {
      const authInfos = await getRequestAuthInfos(req);
      // We inject authInfos in request so we can use them in context
      (req as any).authInfos = authInfos;
    } catch (e) {
      if (e instanceof Error && e.message === ERRORS.INVALID_TOKEN) {
        res.status(401).send({ message: e.message });
        return;
      }
      res.status(400).send({ message: ERRORS.INVALID_REQUEST });
    }
    await handler(req, res);
  }

  res.status(404).end();
}

export default withSessionAPIRoute(graphql as NextApiHandler);
