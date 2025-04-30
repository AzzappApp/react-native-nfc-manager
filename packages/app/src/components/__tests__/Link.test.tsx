import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, View } from 'react-native';
import { RelayEnvironmentProvider } from 'react-relay';
import { createMockEnvironment } from 'relay-test-utils';
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

const environment = createMockEnvironment();

describe('Link', () => {
  afterEach(() => {
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    mockRouter.showModal.mockReset();
  });

  test('should set accessiblity role on given children', () => {
    render(
      <RelayEnvironmentProvider environment={environment}>
        <Link route="HOME">
          <Pressable testID="pressable" />
        </Link>
        ,
      </RelayEnvironmentProvider>,
    );
    expect(screen.queryByTestId('pressable')).toHaveProp(
      'accessibilityRole',
      'link',
    );
  });

  test('should push route when pressed', () => {
    render(
      <RelayEnvironmentProvider environment={environment}>
        <Link route="WEBCARD" params={{ userName: 'hello' }}>
          <Pressable testID="pressable" />
        </Link>
      </RelayEnvironmentProvider>,
    );
    fireEvent.press(screen.getByTestId('pressable'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      id: null,
      route: 'WEBCARD',
      params: { userName: 'hello' },
    });
  });

  test('should not push route if event is default prevented', () => {
    render(
      <RelayEnvironmentProvider environment={environment}>
        <Link route="WEBCARD" params={{ userName: 'hello' }}>
          <Pressable testID="pressable" />
        </Link>
      </RelayEnvironmentProvider>,
    );
    fireEvent.press(screen.getByTestId('pressable'), {
      isDefaultPrevented() {
        return true;
      },
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('should replace router  when pressed and replace is true', () => {
    render(
      <RelayEnvironmentProvider environment={environment}>
        <Link route="WEBCARD" replace params={{ userName: 'hello' }}>
          <Pressable testID="pressable" />
        </Link>
      </RelayEnvironmentProvider>,
    );
    fireEvent.press(screen.getByTestId('pressable'));
    expect(mockRouter.replace).toHaveBeenCalledWith({
      route: 'WEBCARD',
      params: { userName: 'hello' },
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('should push route when children is a view', () => {
    render(
      <RelayEnvironmentProvider environment={environment}>
        <Link route="WEBCARD" params={{ userName: 'hello' }}>
          <View testID="pressable" />
        </Link>
      </RelayEnvironmentProvider>,
    );
    fireEvent.press(screen.getByTestId('pressable'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      id: null,
      route: 'WEBCARD',
      params: { userName: 'hello' },
    });
  });
});
