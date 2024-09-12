import { AsyncLocalStorage } from 'node:async_hooks';
import type * as externalsFunctions from './externals';
import type { Locale } from '@azzapp/i18n';
import type { IMiddleware } from 'graphql-middleware';

export type GraphQLContext = {
  [K in keyof typeof externalsFunctions]: (typeof externalsFunctions)[K];
} & {
  currentUser?: {
    userId?: string;
  };
  locale: Locale;
};

const storage = new AsyncLocalStorage<GraphQLContext>();

export const asyncLocalStorageContextMiddleware: IMiddleware = async (
  resolve,
  parent,
  args,
  context,
  info,
) => storage.run(context, async () => resolve(parent, args, context, info));

export type SessionInfos = {
  userId?: string | null;
  locale: Locale;
};

export const getSessionInfos = (): SessionInfos => {
  const context = storage.getStore();
  if (!context) {
    throw new Error('No context found in getSessionInfos');
  }
  return {
    userId: context.currentUser?.userId,
    locale: context.locale,
  };
};

const sessionMemoizedSymbol = Symbol('sessionMemoized');

export const getOrCreateSessionResource = <T>(
  key: string,
  createFn: () => T,
): T => {
  const context: any = storage.getStore();
  if (!context) {
    throw new Error('No context found in getResourceMap');
  }
  if (!context[sessionMemoizedSymbol]) {
    context[sessionMemoizedSymbol] = new Map<string, any>();
  }
  const map: Map<string, any> = context[sessionMemoizedSymbol];
  if (!map.has(key)) {
    map.set(key, createFn());
  }
  return map.get(key);
};

export const resetSessionResourceAfterMutationMiddleware: IMiddleware = async (
  resolve,
  parent,
  args,
  context,
  info,
) => {
  const result = await resolve(parent, args, context, info);
  if (info.parentType.name === 'Mutation') {
    delete context[sessionMemoizedSymbol];
  }
  return result;
};

export const externalFunction =
  <T extends (...args: any) => any>(
    name: string,
  ): ((...args: Parameters<T>) => ReturnType<T>) =>
  (...args) => {
    const context: any = storage.getStore();
    if (!context) {
      throw new Error('No context found in externalFunction');
    }
    return (context[name] as T)(...args);
  };
