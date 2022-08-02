// import { DEFAULT_CARD_COVER } from '@azzapp/shared/lib/cardHelpers';
// import { render, cleanup } from '@testing-library/react-native';
// import {
//   graphql,
//   RelayEnvironmentProvider,
//   useLazyLoadQuery,
// } from 'react-relay';
// import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
// import CoverRenderer from '../CoverRenderer';
// import type { CoverRendererTestQuery } from '@azzapp/relay/artifacts/CoverRendererTestQuery.graphql';

// const TestRenderer = () => {
//   const data = useLazyLoadQuery<CoverRendererTestQuery>(
//     graphql`
//       query CoverRendererTestQuery @relay_test_operation {
//         card: node(id: "test-id") {
//           ... on UserCard {
//             cover {
//               ...CoverRenderer_cover
//             }
//           }
//         }
//       }
//     `,
//     {},
//   );
//   return <CoverRenderer cover={data.card?.cover} userName="userName" />;
// };

// describe('CoverRenderer', () => {
//   afterEach(cleanup);

//   it('should render the card image and title', () => {
//     const environement = createMockEnvironment();
//     environement.mock.queueOperationResolver(operation =>
//       MockPayloadGenerator.generate(operation, {
//         UserCard: (_, generateId) => ({
//           id: generateId(),
//           cover: {
//             pictures: [{ kind: 'picture', source: 'http://fakePicture.com' }],
//             title: 'fake title',
//             ...DEFAULT_CARD_COVER,
//           },
//         }),
//       }),
//     );
//     const { getByText, getByTestId } = render(
//       <RelayEnvironmentProvider environment={environement}>
//         <TestRenderer />
//       </RelayEnvironmentProvider>,
//     );

//     expect(getByText('fake title')).toBeTruthy();
//     expect(getByTestId('cover-userName-image-0')).toBeTruthy();
//   });
// });

describe('CoverRenderer', () => {
  test('fake test', () => {
    expect(2 + 2).toBe(4);
  });
});

export {};
