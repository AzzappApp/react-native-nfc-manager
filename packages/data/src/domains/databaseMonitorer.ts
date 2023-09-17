import { AsyncLocalStorage } from 'node:async_hooks';

type DatabaseConnectionsInfos = {
  nbRequests: number;
  currentNBRequests: number;
  queries: string[];
  maxConcurrentRequests: number;
};

const storage = new AsyncLocalStorage<DatabaseConnectionsInfos>();

export const getDatabaseConnectionsInfos = () => {
  return storage.getStore();
};

export const startDatabaseConnectionMonitoring = async () => {
  const infos: DatabaseConnectionsInfos = {
    nbRequests: 0,
    currentNBRequests: 0,
    queries: [],
    maxConcurrentRequests: 0,
  };
  storage.enterWith(infos);
};

export const monitorRequest = async (init: RequestInit | undefined) => {
  const infos = storage.getStore();
  if (!infos) {
    return;
  }
  infos.nbRequests++;
  infos.currentNBRequests++;
  if (typeof init?.body === 'string') {
    try {
      const { query } = JSON.parse(init.body ?? '{}');
      infos.queries.push(query);
    } catch {
      // ignore
    }
  }

  if (infos.currentNBRequests > infos.maxConcurrentRequests) {
    infos.maxConcurrentRequests = infos.currentNBRequests;
  }
};

export const monitorRequestEnd = async () => {
  const infos = storage.getStore();
  if (!infos) {
    return;
  }
  infos.currentNBRequests--;
};
