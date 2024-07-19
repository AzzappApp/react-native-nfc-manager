import EventEmitter from 'events';
import { createContext } from 'react';
import type { NativeRouter } from './NativeRouter';
import type { ScreenOptions } from './routerTypes';
import type { Provider } from 'react';

export const RouterContext = createContext<NativeRouter | null>(null);

export const RouterProvider = RouterContext.Provider as Provider<NativeRouter>;

export const ScreenRendererContext = createContext<{
  id: string;
  navigationEventEmitter: EventEmitter;
  hasFocus?: boolean;
  didAppear: boolean;
  setOptions: (
    value:
      | ScreenOptions
      | ((value: ScreenOptions | null) => ScreenOptions | null)
      | null,
  ) => void;
}>({
  id: '',
  navigationEventEmitter: new EventEmitter(),
  didAppear: false,
  setOptions: () => void 0,
});
