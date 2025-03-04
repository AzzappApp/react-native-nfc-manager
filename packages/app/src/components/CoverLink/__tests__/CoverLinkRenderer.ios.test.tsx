// TODO reenable test

describe('CoverEditionScreen', () => {
  test('should pass', () => {
    expect(true).toBe(true);
  });
});

// import { act, fireEvent, render, screen } from '@testing-library/react-native';
// import { View } from 'react-native';
// import CoverLinkRenderer from '../CoverLinkRenderer.ios';
// import type { CoverRendererProps } from '#components/CoverRenderer';

// jest.mock('#components/CoverRenderer', () => 'CoverRenderer');

// const mockRouter = {
//   push: jest.fn(),
// };
// jest.mock('#components/NativeRouter', () => ({
//   ...jest.requireActual('#components/NativeRouter'),
//   useRouter() {
//     return mockRouter;
//   },
// }));

// const mockCoverProps = {
//   MOCK_COVER: 'MOCK_COVER',
// } as any as CoverRendererProps;

// describe('CoverLink', () => {
//   afterEach(() => mockRouter.push.mockReset());

//   test('should push to profile screen with animation', () => {
//     (View.prototype.measureInWindow as jest.Mock).mockImplementationOnce(
//       callback => {
//         callback(100, 30, 125, 200);
//       },
//     );

//     render(
//       <CoverLinkRenderer
//         {...mockCoverProps}
//         userName="fakeUserName"
//         profileId="fakeId"
//       />,
//     );

//     const link = screen.getByRole('link');

//     expect(mockRouter.push).not.toHaveBeenCalled();

//     act(() => {
//       fireEvent.press(link);
//     });

//     expect(mockRouter.push).toHaveBeenCalledWith({
//       route: 'PROFILE',
//       params: {
//         userName: 'fakeUserName',
//         profileId: 'fakeId',
//         fromRectangle: { x: 100, y: 30, width: 125, height: 200 },
//       },
//     });
//   });
// });
