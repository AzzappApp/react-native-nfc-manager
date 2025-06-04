import { AsyncLocalStorage } from 'node:async_hooks';
import env from '#env';
import type { IMiddleware } from 'graphql-middleware';

export type FieldLog = {
  path: string;
  duration: number;
};

export type GQLPerformanceInfos = {
  fieldLogs: FieldLog[];
  requestStart: number;
};

const storage = new AsyncLocalStorage<GQLPerformanceInfos>();

export const isPerformanceLoggingEnabled = () =>
  env.ENABLE_GRAPHQL_PERFORMANCE_LOGGING === 'true';

export const startPerformanceLogging = async () => {
  storage.enterWith({ fieldLogs: [], requestStart: performance.now() });
};

export const getPerformanceLogs = (): GQLPerformanceInfos | undefined => {
  return storage.getStore();
};

export const performanceLoggingMiddleware: IMiddleware = async (
  resolve,
  parent,
  args,
  context,
  info,
) => {
  if (!isPerformanceLoggingEnabled()) {
    return resolve(parent, args, context, info);
  }
  const start = performance.now();
  const result = await resolve(parent, args, context, info);
  const duration = performance.now() - start;
  getPerformanceLogs()?.fieldLogs.push({
    path: `${info.parentType.name}.${info.fieldName}`,
    duration,
  });
  return result;
};

export default performanceLoggingMiddleware;
