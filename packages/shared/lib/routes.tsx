const ROUTES = {
  HOME: 'HOME',
  SIGN_IN: 'SIGN_IN',
  SIGN_UP: 'SIGN_UP',
  USER: 'USER',
  SEARCH: 'SEARCH',
  NEW_POST: 'NEW_POST',
  POST: 'POST',
  CHAT: 'CHAT',
  PROFILE: 'PROFILE',
} as const;

export default ROUTES;

export type Routes = keyof typeof ROUTES;
