/**
 * Events dispatched when an user signs up
 */
export type SIGN_UP_EVENTS = {
  type: 'SIGN_UP';
  payload: {
    authTokens: { token: string; refreshToken: string };
    email?: string | null;
    phoneNumber?: string | null;
    userId: string;
  };
};

/**
 * Events dispatched when an user signs in
 */
export type SIGN_IN = {
  type: 'SIGN_IN';
  payload: {
    authTokens: { token: string; refreshToken: string };
    profileInfos?: {
      profileId: string;
      webCardId: string;
      profileRole: string;
    } | null;
    email?: string | null;
    phoneNumber?: string | null;
    userId: string;
  };
};

/**
 * Events dispatched when an user signs out
 */
export type SIGN_OUT = {
  type: 'SIGN_OUT';
};

/**
 * Events dispatched when an user changes the current profile
 */
export type WEBCARD_CHANGE = {
  type: 'WEBCARD_CHANGE';
  payload: {
    profileId: string;
    webCardId: string;
    profileRole: string;
  };
};

/**
 * Events dispatched when an error occurs while making a network request
 */
export type NETWORK_ERROR = {
  type: 'NETWORK_ERROR';
  payload: {
    error: unknown;
    params: any;
  };
};

/**
 * Events dispatched when the auth tokens are successfully refreshed
 */
export type TOKENS_REFRESHED = {
  type: 'TOKENS_REFRESHED';
  payload: {
    authTokens: { token: string; refreshToken: string };
  };
};

export type GlobalEvents =
  | NETWORK_ERROR
  | SIGN_IN
  | SIGN_OUT
  | SIGN_UP_EVENTS
  | TOKENS_REFRESHED
  | WEBCARD_CHANGE;

export const GLOBAL_EVENT_DEFAULT_PRIORITY = 0;

export const GLOBAL_EVENT_HIGH_PRIORITY = 100;

type TypeToLister<TType extends GlobalEvents['type']> = TType extends 'SIGN_UP'
  ? SIGN_UP_EVENTS
  : TType extends 'SIGN_IN'
    ? SIGN_IN
    : TType extends 'SIGN_OUT'
      ? SIGN_OUT
      : TType extends 'WEBCARD_CHANGE'
        ? WEBCARD_CHANGE
        : TType extends 'NETWORK_ERROR'
          ? NETWORK_ERROR
          : TType extends 'TOKENS_REFRESHED'
            ? TOKENS_REFRESHED
            : never;

type EventListener<T extends GlobalEvents> =
  | ((event: T) => Promise<any>)
  | ((event: T) => void);

const listeners: {
  [key in GlobalEvents['type']]?: Map<EventListener<TypeToLister<key>>, number>;
} = {};

/**
 * Add a listener for a global event
 * @param type the type of the event
 * @param listener the callback to call when the event is dispatched
 * @returns a function to remove the listener
 */
export const addGlobalEventListener = <T extends GlobalEvents['type']>(
  type: T,
  listener: EventListener<TypeToLister<T>>,
  priority = GLOBAL_EVENT_DEFAULT_PRIORITY,
) => {
  if (!listeners[type]) {
    (listeners as any)[type] = new Map();
  }
  listeners[type]?.set(listener, priority);
  return () => {
    listeners[type]?.delete(listener);
  };
};

/**
 * Dispatch a global event returnin a promise that resolves when all listeners
 * have finished processing the event
 *
 * @param event the event to dispatch
 */
export const dispatchGlobalEvent = async (
  event: GlobalEvents,
): Promise<void> => {
  const eventListeners = [...(listeners[event.type]?.entries() ?? [])]
    .sort(([, priorityA], [, priorityB]) => priorityB - priorityA)
    .map(([listener]) => listener);
  for (const listener of eventListeners) {
    await Promise.resolve((listener as any)(event)).catch(error => {
      console.error('Error while processing event ', event, error);
    });
  }
};
