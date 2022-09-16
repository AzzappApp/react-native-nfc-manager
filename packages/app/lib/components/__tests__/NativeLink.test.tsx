import { fireEvent, render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { Pressable } from 'react-native';
import NativeLink from '../NativeLink';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  showModal: jest.fn(),
};
jest.mock('../../PlatformEnvironment', () => ({
  useRouter() {
    return mockRouter;
  },
}));

describe('NativeLink', () => {
  afterEach(() => {
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    mockRouter.showModal.mockReset();
  });

  test('should set accessiblity role on given children', () => {
    render(
      <NativeLink route="HOME">
        <Pressable testID="pressable" />
      </NativeLink>,
    );
    expect(screen.queryByTestId('pressable')).toHaveProp(
      'accessibilityRole',
      'link',
    );
  });

  test('should push route when pressed', () => {
    render(
      <NativeLink route="USER" params={{ userName: 'hello' }}>
        <Pressable testID="pressable" />
      </NativeLink>,
    );
    fireEvent.press(screen.getByTestId('pressable'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      route: 'USER',
      params: { userName: 'hello' },
    });
  });

  test('should not push route if event is default prevented', () => {
    render(
      <NativeLink route="USER" params={{ userName: 'hello' }}>
        <Pressable testID="pressable" />
      </NativeLink>,
    );
    fireEvent.press(screen.getByTestId('pressable'), {
      isDefaultPrevented() {
        return true;
      },
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('should show modal  when pressed and modal is true', () => {
    render(
      <NativeLink route="USER" modal params={{ userName: 'hello' }}>
        <Pressable testID="pressable" />
      </NativeLink>,
    );
    fireEvent.press(screen.getByTestId('pressable'));
    expect(mockRouter.showModal).toHaveBeenCalledWith({
      route: 'USER',
      params: { userName: 'hello' },
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('should replace router  when pressed and replace is true', () => {
    render(
      <NativeLink route="USER" replace params={{ userName: 'hello' }}>
        <Pressable testID="pressable" />
      </NativeLink>,
    );
    fireEvent.press(screen.getByTestId('pressable'));
    expect(mockRouter.replace).toHaveBeenCalledWith({
      route: 'USER',
      params: { userName: 'hello' },
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
