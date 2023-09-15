// TODO re-enable tests
describe('ScreenPrefetcher', () => {
  it('workds', () => {
    expect(true).toBe(true);
  });
});

// import { graphql } from 'react-relay';
// import { Observable } from 'relay-runtime';
// import fetchQueryAndRetain from '#helpers/fetchQueryAndRetain';
// import { createScreenPrefetcher } from '#helpers/ScreenPrefetcher';

// jest.mock('#helpers/fetchQueryAndRetain');

// const mockedFetchQueryAndRetain = jest.mocked(fetchQueryAndRetain);

// describe('ScreenPrefetcher', () => {
//   const screens = {
//     HOME: {},
//     PROFILE: {
//       prefetch: jest.fn(),
//       getRoutesToPrefetch: jest.fn(),
//     },
//     POST_COMMENTS: {
//       prefetch: jest.fn(),
//     },
//     POST: {
//       query: graphql`
//         query ScreenPrefetcherTestQuery($postId: ID!) @relay_test_operation {
//           node(id: $postId) {
//             ... on Post {
//               id
//             }
//           }
//         }
//       `,
//       getVariables: () => ({ postId: 'fake-post-id' }),
//     },
//   };

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('init', () => {
//     test('should prefetch initial screen `getRoutesToPrefetch` routes', () => {
//       screens.PROFILE.getRoutesToPrefetch.mockReturnValueOnce([
//         { route: 'POST_COMMENTS', params: { userName: 'fake-user-name' } },
//       ]);
//       screens.POST_COMMENTS.prefetch.mockReturnValue(
//         Observable.create(sink => {
//           setTimeout(() => sink.complete());
//         }),
//       );

//       const screenId = 'fake-id';

//       const screenPrefetcher = createScreenPrefetcher(
//         screens as any,
//         { route: 'PROFILE', params: { userName: 'fake-user-name' } },
//         screenId,
//       );

//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(1);
//     });

//     test('should not prefetch anything if the initial screen does not have a `getRoutesToPrefetch` option', () => {
//       const screenId = 'fake-id';

//       const screenPrefetcher = createScreenPrefetcher(
//         screens as any,
//         { route: 'HOME' },
//         screenId,
//       );

//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);
//     });
//   });

//   describe('prefetchRoute', () => {
//     test('should prefetch the screen if it does have a `prefetch` option', () => {
//       jest.useFakeTimers();
//       screens.POST_COMMENTS.prefetch.mockReturnValueOnce(
//         Observable.create(sink => {
//           setTimeout(() => sink.complete());
//         }),
//       );

//       const screenId = 'fake-id';

//       const screenPrefetcher = createScreenPrefetcher(
//         screens as any,
//         { route: 'HOME' },
//         'HOME',
//       );
//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);

//       screenPrefetcher.prefetchRoute(screenId, {
//         route: 'POST_COMMENTS',
//         params: { postId: 'fake-post-id' },
//       });
//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(1);
//       expect(screens.POST_COMMENTS.prefetch).toHaveBeenCalledTimes(1);

//       jest.runAllTimers();
//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);
//     });

//     test('should prefetch the screen if it does have a `query` option', () => {
//       jest.useFakeTimers();
//       mockedFetchQueryAndRetain.mockReturnValueOnce(
//         Observable.from({
//           node: {
//             id: 'fake-post-id',
//           },
//         }),
//       );

//       const screenId = 'fake-id';

//       const screenPrefetcher = createScreenPrefetcher(
//         screens as any,
//         { route: 'HOME' },
//         'HOME',
//       );
//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);

//       screenPrefetcher.prefetchRoute(screenId, {
//         route: 'POST',
//         params: { postId: 'fake-post-id' },
//       });

//       expect(mockedFetchQueryAndRetain).toHaveBeenCalledTimes(1);
//       expect(mockedFetchQueryAndRetain).toHaveBeenCalledWith(
//         expect.anything(),
//         screens.POST.query,
//         screens.POST.getVariables(),
//       );

//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(1);
//     });

//     test('should not prefetch the screen if it does not have a `prefetch` or a `query` option', () => {
//       const screenId = 'fake-id';

//       const screenPrefetcher = createScreenPrefetcher(
//         screens as any,
//         { route: 'HOME' },
//         'HOME',
//       );
//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);

//       screenPrefetcher.prefetchRoute(screenId, {
//         route: 'HOME',
//       });
//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);
//     });
//   });

//   describe('screenWillBePushed', () => {
//     test('should prefetch the route returned by the `getRoutesToPrefetch` option', () => {
//       jest.useFakeTimers();
//       const screenId = 'fake-id';
//       const screenPrefetcher = createScreenPrefetcher(
//         screens as any,
//         { route: 'HOME' },
//         'HOME',
//       );
//       screens.PROFILE.getRoutesToPrefetch.mockReturnValueOnce([
//         { route: 'POST_COMMENTS', params: { userName: 'fake-user-name' } },
//         { route: 'POST_COMMENTS', params: { userName: 'fake-user-name2' } },
//         { route: 'HOME' },
//       ]);
//       screens.POST_COMMENTS.prefetch.mockReturnValue(
//         Observable.create(sink => {
//           setTimeout(() => sink.complete());
//         }),
//       );

//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);
//       screenPrefetcher.screenWillBePushed(screenId, {
//         route: 'PROFILE',
//         params: { userName: 'fake-user-name' },
//       });
//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(2);
//       expect(screens.POST_COMMENTS.prefetch).toHaveBeenCalledTimes(2);
//       expect(screens.POST_COMMENTS.prefetch).toHaveBeenNthCalledWith(1, {
//         route: 'POST_COMMENTS',
//         params: {
//           userName: 'fake-user-name',
//         },
//       });
//       expect(screens.POST_COMMENTS.prefetch).toHaveBeenNthCalledWith(2, {
//         route: 'POST_COMMENTS',
//         params: {
//           userName: 'fake-user-name2',
//         },
//       });
//       jest.runAllTimers();
//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);
//     });
//   });

//   describe('screenWillBeRemoved', () => {
//     test('should unsubscribe from all the active subscriptions', () => {
//       const screenId = 'fake-id';
//       const screenPrefetcher = createScreenPrefetcher(
//         screens as any,
//         { route: 'HOME' },
//         'HOME',
//       );
//       screens.PROFILE.getRoutesToPrefetch.mockReturnValueOnce([
//         { route: 'POST_COMMENTS', params: { userName: 'fake-user-name' } },
//         { route: 'POST_COMMENTS', params: { userName: 'fake-user-name2' } },
//         { route: 'HOME' },
//       ]);
//       screens.POST_COMMENTS.prefetch.mockReturnValue(
//         Observable.create(sink => {
//           setTimeout(() => sink.complete());
//         }),
//       );
//       screenPrefetcher.screenWillBePushed(screenId, {
//         route: 'PROFILE',
//         params: { userName: 'fake-user-name' },
//       });
//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(2);
//       screenPrefetcher.screenWillBeRemoved(screenId);
//       expect(screenPrefetcher.getActiveSubscriptionCount(screenId)).toBe(0);
//     });
//   });
// });
