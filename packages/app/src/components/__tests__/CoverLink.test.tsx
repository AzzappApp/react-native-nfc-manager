import { act, fireEvent, render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { View } from 'react-native';
import CoverLink from '../CoverLink';
import type { CoverRendererProps } from '../CoverRenderer';

jest.mock('../CoverRenderer', () => 'CoverRenderer');

const mockRouter = {
  push: jest.fn(),
};
jest.mock('#PlatformEnvironment', () => ({
  useRouter() {
    return mockRouter;
  },
}));

const mockCoverProps = {
  MOCK_COVER: 'MOCK_COVER',
} as any as CoverRendererProps;

describe('CoverLink', () => {
  afterEach(() => mockRouter.push.mockReset());

  test('should push to profile screen with animation', () => {
    (View.prototype.measureInWindow as jest.Mock).mockImplementationOnce(
      callback => {
        callback(100, 30, 125, 200);
      },
    );

    render(
      <CoverLink
        {...mockCoverProps}
        userName="fakeUserName"
        profileID="fakeId"
      />,
    );

    const link = screen.getByRole('link');

    expect(mockRouter.push).not.toHaveBeenCalled();

    act(() => {
      fireEvent.press(link);
    });

    expect(mockRouter.push).toHaveBeenCalledWith({
      route: 'PROFILE',
      params: {
        userName: 'fakeUserName',
        profileID: 'fakeId',
        fromRectangle: { x: 100, y: 30, width: 125, height: 200 },
      },
    });
  });
});
