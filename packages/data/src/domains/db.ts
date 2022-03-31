import cassandra from 'cassandra-driver';

const {
  DB_CONTACT_POINT,
  DB_DATACENTER,
  DB_USERNAME,
  DB_PASSWORD,
  DB_KEYSPACE,
} = process.env;

let client: cassandra.Client | null = null;

// TODO should we implement connection cleaning mechanism like
// serverless-mysql ?
// TODO should we implement a mechanism for prepared statement
// so we can share them between lambda ?
export const getClient = () => {
  if (!client) {
    client = new cassandra.Client({
      contactPoints: DB_CONTACT_POINT?.split(','),
      localDataCenter: DB_DATACENTER,
      credentials: { username: DB_USERNAME!, password: DB_PASSWORD! },
      keyspace: DB_KEYSPACE,
      // heartbeats during freeze ?
      // pooling: { heartBeatInterval: 0 }

      // If trying to reduce Cold Start time, the driver's automatic metadata
      // synchronization and pool warmup can be disabled
      // isMetadataSyncEnabled: false,
      // pooling: { warmup: false }
    });
  }
  return client;
};

export const shutdown = async () => {
  await client?.shutdown();
  client = null;
};
