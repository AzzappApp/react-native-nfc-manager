import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, View } from 'react-native';
import Link from '../Link';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  showModal: jest.fn(),
};
jest.mock('#components/NativeRouter', () => ({
  ...jest.requireActual('#components/NativeRouter'),
  useRouter() {
    return mockRouter;
  },
}));

jest.mock('#helpers/ScreenPrefetcher');

describe('Link', () => {
  afterEach(() => {
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    mockRouter.showModal.mockReset();
  });

  test('should set accessiblity role on given children', () => {
    render(
      <Link route="HOME">
        <Pressable testID="pressable" />
      </Link>,
    );
    expect(screen.queryByTestId('pressable')).toHaveProp(
      'accessibilityRole',
      'link',
    );
  });

  test('should push route when pressed', () => {
    render(
      <Link route="PROFILE" params={{ userName: 'hello' }}>
        <Pressable testID="pressable" />
      </Link>,
    );
    fireEvent.press(screen.getByTestId('pressable'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      id: null,
      route: 'PROFILE',
      params: { userName: 'hello' },
    });
  });

  test('should not push route if event is default prevented', () => {
    render(
      <Link route="PROFILE" params={{ userName: 'hello' }}>
        <Pressable testID="pressable" />
      </Link>,
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
      <Link route="PROFILE" modal params={{ userName: 'hello' }}>
        <Pressable testID="pressable" />
      </Link>,
    );
    fireEvent.press(screen.getByTestId('pressable'));
    expect(mockRouter.showModal).toHaveBeenCalledWith({
      route: 'PROFILE',
      params: { userName: 'hello' },
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('should replace router  when pressed and replace is true', () => {
    render(
      <Link route="PROFILE" replace params={{ userName: 'hello' }}>
        <Pressable testID="pressable" />
      </Link>,
    );
    fireEvent.press(screen.getByTestId('pressable'));
    expect(mockRouter.replace).toHaveBeenCalledWith({
      route: 'PROFILE',
      params: { userName: 'hello' },
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('should push route when children is a view', () => {
    render(
      <Link route="PROFILE" params={{ userName: 'hello' }}>
        <View testID="pressable" />
      </Link>,
    );
    fireEvent.press(screen.getByTestId('pressable'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      id: null,
      route: 'PROFILE',
      params: { userName: 'hello' },
    });
  });
});
