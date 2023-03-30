/**
 * A module for dispatching global events throughout the app.
 * Should be used only on mobile app and in mobile specific components.
 */

import getRuntimeEnvironment from '@azzapp/shared/getRuntimeEnvironment';

/**
 * Events dispatched when an user signs up
 */
export type SIGN_UP_EVENTS = {
  type: 'SIGN_UP';
  payload: {
    authTokens: { token: string; refreshToken: string };
  };
};

/**
 * Events dispatched when an user signs in
 */
export type SINGN_IN = {
  type: 'SIGN_IN';
  payload: {
    authTokens: { token: string; refreshToken: string };
    profileId?: string;
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
export type PROFILE_CHANGE = {
  type: 'PROFILE_CHANGE';
  payload: {
    profileId: string;
    authTokens: { token: string; refreshToken: string };
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
  | PROFILE_CHANGE
  | SIGN_OUT
  | SIGN_UP_EVENTS
  | SINGN_IN
  | TOKENS_REFRESHED;

type TypeToLister<TType extends GlobalEvents['type']> = TType extends 'SIGN_UP'
  ? SIGN_UP_EVENTS
  : TType extends 'SIGN_IN'
  ? SINGN_IN
  : TType extends 'SIGN_OUT'
  ? SIGN_OUT
  : TType extends 'PROFILE_CHANGE'
  ? PROFILE_CHANGE
  : TType extends 'NETWORK_ERROR'
  ? NETWORK_ERROR
  : TType extends 'TOKENS_REFRESHED'
  ? TOKENS_REFRESHED
  : never;

type EventListener<T extends GlobalEvents> = (event: T) => void;

const listeners: {
  [key in GlobalEvents['type']]?: Set<EventListener<TypeToLister<key>>>;
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
) => {
  ensureMobile();
  if (!listeners[type]) {
    (listeners as any)[type] = new Set();
  }
  listeners[type]?.add(listener);
  return () => {
    listeners[type]?.delete(listener);
  };
};

/**
 * Dispatch a global event
 * @param event the event to dispatch
 */
export const dispatchGlobalEvent = (event: GlobalEvents) => {
  ensureMobile();
  const eventListeners = listeners[event.type];
  for (const listener of eventListeners?.values() ?? []) {
    (listener as any)(event);
  }
};

const ensureMobile = () => {
  if (
    process.env.NODE_ENV !== 'production' &&
    getRuntimeEnvironment() !== 'react-native'
  ) {
    throw new Error('globalEvents module is not supported on web');
  }
};
