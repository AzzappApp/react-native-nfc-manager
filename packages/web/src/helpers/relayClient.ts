import createRelayEnvironment from '@azzapp/shared/lib/createRelayEnvironment';
import getRuntimeEnvironment from '@azzapp/shared/lib/getRuntimeEnvironment';
import { Environment, Network, Store, RecordSource } from 'relay-runtime';
let relayEnvironment: Environment | null;

const createFakeServerEnvironment = () => {
  return new Environment({
    network: Network.create(() => {
      throw new Error('No fetch should be done on server');
    }),
    store: new Store(new RecordSource()),
    isServer: true,
  });
};

export const getRelayEnvironment = () => {
  if (getRuntimeEnvironment() === 'node') {
    return createFakeServerEnvironment();
  }
  if (!relayEnvironment) {
    relayEnvironment = createRelayEnvironment({
      cacheConfig: { size: 10, ttl: 2000 },
    });
  }
  return relayEnvironment;
};
