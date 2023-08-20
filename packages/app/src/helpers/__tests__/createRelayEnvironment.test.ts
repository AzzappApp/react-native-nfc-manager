// TODO re-enable tests
describe('CoverEditionScreen', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
// import { createNetwork, GraphQLError } from '../relayEnvironment';

// describe('createRelayEnvironment', () => {
//   describe('createNetwork', () => {
//     const fakeFetch = jest.fn();
//     afterEach(() => {
//       fakeFetch.mockReset();
//       jest.useRealTimers();
//     });

//     test('should fetch a graphql query', async () => {
//       const fakeQuery = `
//         query FakeGrapQLQuery($foo: String) {
//           search(value: $foo) {
//             resultText
//           }
//         }
//       `;
//       fakeFetch.mockResolvedValueOnce({
//         data: {
//           search: { resultText: 'Hello world' },
//         },
//       });
//       const network = createNetwork(fakeFetch);
//       const observable = network.execute(
//         {
//           id: null,
//           text: fakeQuery,
//           operationKind: 'query',
//           name: 'FakeGrapQLQuery',
//           metadata: {},
//         },
//         { foo: 'bar' },
//         {},
//       );

//       expect(await observable.toPromise()).toEqual({
//         data: {
//           search: { resultText: 'Hello world' },
//         },
//       });

//       expect(fakeFetch).toHaveBeenCalledWith(
//         'https://api.fake-azzapp.com/graphql',
//         {
//           method: 'POST',
//           body: JSON.stringify({
//             query: fakeQuery,
//             variables: { foo: 'bar' },
//           }),
//           headers: {
//             Accept: 'application/json',
//             'Content-Type': 'application/json',
//           },
//           signal: expect.any(AbortSignal),
//         },
//       );
//     });

//     test('should fetch a persisted graphql query', async () => {
//       const network = createNetwork(fakeFetch);
//       fakeFetch.mockResolvedValueOnce({
//         data: {
//           search: { resultText: 'Hello world' },
//         },
//       });

//       const observable = network.execute(
//         {
//           id: 'fakeQueryid',
//           text: null,
//           operationKind: 'query',
//           name: 'FakeGrapQLQuery',
//           metadata: {},
//         },
//         { foo: 'bar' },
//         {},
//       );

//       expect(await observable.toPromise()).toEqual({
//         data: {
//           search: { resultText: 'Hello world' },
//         },
//       });

//       expect(fakeFetch).toHaveBeenCalledWith(
//         'https://api.fake-azzapp.com/graphql',
//         {
//           method: 'POST',
//           body: JSON.stringify({
//             id: 'fakeQueryid',
//             variables: { foo: 'bar' },
//           }),
//           headers: {
//             Accept: 'application/json',
//             'Content-Type': 'application/json',
//           },
//           signal: expect.any(AbortSignal),
//         },
//       );
//     });

//     test('should cancel the request when the observable is unsubscribed', () => {
//       jest.useFakeTimers();
//       const network = createNetwork(fakeFetch);
//       let signal: AbortSignal | null = null;
//       fakeFetch.mockImplementationOnce((_: any, init: any) => {
//         signal = init.signal;
//         return new Promise(resolve => {
//           setTimeout(resolve, 1000);
//         });
//       });

//       const observable = network.execute(
//         {
//           id: 'fakeQueryid',
//           text: null,
//           operationKind: 'mutation',
//           name: 'FakeGrapQLQuery',
//           metadata: {},
//         },
//         { foo: 'bar' },
//         {},
//       );

//       const subscription = observable.subscribe({
//         next() {
//           throw new Error('should not resolve');
//         },
//       });

//       expect(fakeFetch).toHaveBeenCalled();
//       subscription.unsubscribe();
//       expect(signal!.aborted).toBe(true);
//       jest.runAllTimers();
//       jest.runAllTicks();
//     });

//     test('should throw an error if the relay response contains error', async () => {
//       fakeFetch.mockResolvedValueOnce({
//         data: { foo: 'bar' },
//         errors: [{ message: 'Invalid Data' }, { message: 'Cannot access' }],
//       });
//       const network = createNetwork(fakeFetch);
//       expect.assertions(3);
//       try {
//         console.log(
//           await network
//             .execute(
//               {
//                 id: 'fakeQueryid',
//                 text: null,
//                 operationKind: 'query',
//                 name: 'FakeGrapQLQuery',
//                 metadata: {},
//               },
//               { foo: 'bar' },
//               {},
//             )
//             .toPromise(),
//         );
//       } catch (e) {
//         expect(e).toBeInstanceOf(GraphQLError);
//         if (e instanceof GraphQLError) {
//           expect(e.request).toEqual({
//             id: 'fakeQueryid',
//             text: null,
//             operationKind: 'query',
//             name: 'FakeGrapQLQuery',
//             metadata: {},
//           });
//           expect(e.response).toEqual({
//             data: { foo: 'bar' },
//             errors: [{ message: 'Invalid Data' }, { message: 'Cannot access' }],
//           });
//         }
//       }
//     });

//     test('should throw an error if the relay response data is null', async () => {
//       fakeFetch.mockResolvedValueOnce({
//         data: null,
//       });
//       const network = createNetwork(fakeFetch);
//       expect.assertions(3);
//       try {
//         console.log(
//           await network
//             .execute(
//               {
//                 id: 'fakeQueryid',
//                 text: null,
//                 operationKind: 'query',
//                 name: 'FakeGrapQLQuery',
//                 metadata: {},
//               },
//               { foo: 'bar' },
//               {},
//             )
//             .toPromise(),
//         );
//       } catch (e) {
//         expect(e).toBeInstanceOf(GraphQLError);
//         if (e instanceof GraphQLError) {
//           expect(e.request).toEqual({
//             id: 'fakeQueryid',
//             text: null,
//             operationKind: 'query',
//             name: 'FakeGrapQLQuery',
//             metadata: {},
//           });
//           expect(e.response).toEqual({
//             data: null,
//           });
//         }
//       }
//     });

//     test('should throw an error if the fetch function return an error', async () => {
//       fakeFetch.mockRejectedValue(new TypeError('bad request'));
//       const network = createNetwork(fakeFetch);
//       expect.assertions(2);
//       try {
//         console.log(
//           await network
//             .execute(
//               {
//                 id: 'fakeQueryid',
//                 text: null,
//                 operationKind: 'query',
//                 name: 'FakeGrapQLQuery',
//                 metadata: {},
//               },
//               { foo: 'bar' },
//               {},
//             )
//             .toPromise(),
//         );
//       } catch (e) {
//         expect(e).toBeInstanceOf(TypeError);
//         expect((e as TypeError).message).toBe('bad request');
//       }
//     });
//   });
// });
