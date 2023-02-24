import Cors from 'cors';
import { graphql } from 'graphql';
import { createGraphQLContext, graphQLSchema } from '@azzapp/data';
import queryMap from '@azzapp/relay/query-map.json';
import ERRORS from '@azzapp/shared/lib/errors';
import applyConnectMiddleware from '../../helpers/applyConnectMiddleware';
import {
  getRequestAuthInfos,
  withSessionAPIRoute,
} from '../../helpers/session';
import type { ViewerInfos } from '@azzapp/data/lib/schema/GraphQLContext';
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

// TODO production security settings
const cors = Cors();

async function graphqlHandler(req: NextApiRequest, res: NextApiResponse) {
  await applyConnectMiddleware(req, res, cors);

  if (req.method === 'OPTIONS') {
    res.end();
    return false;
  }

  if (req.method === 'POST') {
    let viewerInfos: ViewerInfos;
    try {
      viewerInfos = await getRequestAuthInfos(req);
    } catch (e) {
      if (e instanceof Error && e.message === ERRORS.INVALID_TOKEN) {
        res.status(401).send({ message: ERRORS.INVALID_TOKEN });
      } else {
        res.status(400).send({ message: ERRORS.INVALID_REQUEST });
      }
      return;
    }

    // TODO from relay examples, but do we really need to decode it manually ?
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const requestParams = JSON.parse(Buffer.concat(buffers).toString());
    try {
      res.json(
        await graphql({
          schema: graphQLSchema,
          rootValue: {},
          source: requestParams.id
            ? (queryMap as any)[requestParams.id]
            : requestParams.query,
          variableValues: requestParams.variables,
          contextValue: createGraphQLContext(viewerInfos),
        }),
      );
    } catch (e) {
      console.log(e);
      res.status(500).send({ message: ERRORS.INTERNAL_SERVER_ERROR });
    }
    return;
  }

  res.status(404).end();
}

export default withSessionAPIRoute(graphqlHandler as NextApiHandler);

export const config = {
  api: {
    bodyParser: false,
  },
};
