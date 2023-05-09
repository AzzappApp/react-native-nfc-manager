import { Observable } from 'relay-runtime';
import { createScreenPrefetcher } from '#helpers/ScreenPrefetcher';

describe('ScreenPrefetcher', () => {
  const screens = {
    HOME: {},
    PROFILE: {
      prefetch: jest.fn(),
      getRoutesToPrefetch: jest.fn(),
    },
    PROFILE_POSTS: {
      prefetch: jest.fn(),
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('prefetchRoute', () => {
    test('should prefetch the screen if it does have a `prefetch` options', () => {
      jest.useFakeTimers();
      screens.PROFILE_POSTS.prefetch.mockReturnValueOnce(
        Observable.create(sink => {
          setTimeout(() => sink.complete());
        }),
      );

      const screenId = 'fake-id';

      const screenPrefetcher = createScreenPrefetcher(screens as any);
      expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);

      screenPrefetcher.prefetchRoute(screenId, {
        route: 'PROFILE_POSTS',
        params: { userName: 'fake-user-name' },
      });
      expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(1);
      expect(screens.PROFILE_POSTS.prefetch).toHaveBeenCalledTimes(1);

      jest.runAllTimers();
      expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);
    });

    test('should not prefetch the screen if it does not have a `prefetch` options', () => {
      const screenId = 'fake-id';

      const screenPrefetcher = createScreenPrefetcher(screens as any);
      expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);

      screenPrefetcher.prefetchRoute(screenId, {
        route: 'HOME',
      });
      expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);
    });
  });

  describe('screenWillBePushed', () => {
    test('should prefetch the route returned by the `getRoutesToPrefetch` options', () => {
      jest.useFakeTimers();
      const screenId = 'fake-id';
      const screenPrefetcher = createScreenPrefetcher(screens as any);
      screens.PROFILE.getRoutesToPrefetch.mockReturnValueOnce([
        { route: 'PROFILE_POSTS', params: { userName: 'fake-user-name' } },
        { route: 'PROFILE_POSTS', params: { userName: 'fake-user-name2' } },
        { route: 'HOME' },
      ]);
      screens.PROFILE_POSTS.prefetch.mockReturnValue(
        Observable.create(sink => {
          setTimeout(() => sink.complete());
        }),
      );

      expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);
      screenPrefetcher.screenWillBePushed(screenId, {
        route: 'PROFILE',
        params: { userName: 'fake-user-name' },
      });
      expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(2);
      expect(screens.PROFILE_POSTS.prefetch).toHaveBeenCalledTimes(2);
      expect(screens.PROFILE_POSTS.prefetch).toHaveBeenNthCalledWith(1, {
        route: 'PROFILE_POSTS',
        params: {
          userName: 'fake-user-name',
        },
      });
      expect(screens.PROFILE_POSTS.prefetch).toHaveBeenNthCalledWith(2, {
        route: 'PROFILE_POSTS',
        params: {
          userName: 'fake-user-name2',
        },
      });
      jest.runAllTimers();
      expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);
    });
  });

  describe('screenWillBeRemoved', () => {
    test('should unsubscribe from all the active subscriptions', () => {
      const screenId = 'fake-id';
      const screenPrefetcher = createScreenPrefetcher(screens as any);
      screens.PROFILE.getRoutesToPrefetch.mockReturnValueOnce([
        { route: 'PROFILE_POSTS', params: { userName: 'fake-user-name' } },
        { route: 'PROFILE_POSTS', params: { userName: 'fake-user-name2' } },
        { route: 'HOME' },
      ]);
      screens.PROFILE_POSTS.prefetch.mockReturnValue(
        Observable.create(sink => {
          setTimeout(() => sink.complete());
        }),
      );
      screenPrefetcher.screenWillBePushed(screenId, {
        route: 'PROFILE',
        params: { userName: 'fake-user-name' },
      });
      expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(2);
      screenPrefetcher.screenWillBeRemoved(screenId);
      expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);
    });
  });
});
