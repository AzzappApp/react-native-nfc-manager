import { Suspense } from 'react';
import { Platform } from 'react-native';
import { RelayEnvironmentProvider, loadQuery } from 'react-relay';
import { MockPayloadGenerator } from 'relay-test-utils';
import { createMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';
import { getAppleWalletPass, getGoogleWalletPass } from '#helpers/MobileWebAPI';
import { screen, render, fireEvent, act } from '#helpers/testHelpers';
import ContactCardScreenQueryNode from '#relayArtifacts/ContactCardScreenQuery.graphql';
import { ContactCardScreen } from '../ContactCardScreen';
import type { ContactCardScreenQuery } from '#relayArtifacts/ContactCardScreenQuery.graphql';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

jest.mock('@reeq/react-native-passkit', () => ({
  addPass: jest.fn(),
  addPassJWT: jest.fn(),
}));

jest.mock('react-native-blob-jsi-helper', () => ({
  getArrayBufferForBlob: jest.fn(),
}));

jest.mock('react-native-quick-base64', () => ({
  fromByteArray: jest.fn(),
}));

jest.mock('react-native-blob-util', () => ({
  fs: {
    writeFile: jest.fn(),
    dirs: {
      CacheDir: 'CacheDir',
    },
  },
}));

jest.mock('#helpers/MobileWebAPI', () => ({
  getAppleWalletPass: jest.fn(),
  getGoogleWalletPass: jest.fn(),
}));

jest.mock('react-native-share', () => ({ open: jest.fn() }));

jest.mock('@shopify/react-native-skia', () => ({
  rect: jest.fn(),
  Skia: {
    SVG: {
      MakeFromString: jest.fn(),
    },
  },
  TextAlign: {},
}));

const getAppleWalletPassMock = getAppleWalletPass as jest.MockedFunction<
  typeof getAppleWalletPass
>;

const getGoogleWalletPassMock = getGoogleWalletPass as jest.MockedFunction<
  typeof getGoogleWalletPass
>;

describe('ContactCardScreen', () => {
  let environment: RelayMockEnvironment;

  const renderContactCardScreen = () => {
    environment = createMockEnvironment();
    environment.mock.queuePendingOperation(ContactCardScreenQueryNode, {
      profileId: 'testProfileId',
    });
    environment.mock.queueOperationResolver(operation => {
      return MockPayloadGenerator.generate(operation, {
        Profile() {
          return {
            webCard: {
              userName: 'testUserName',
              cardColors: {
                primary: '#FFFFFF',
              },
            },
          };
        },
      });
    });

    const preloadedQuery = loadQuery<ContactCardScreenQuery>(
      environment,
      ContactCardScreenQueryNode,
      {
        profileId: 'testProfileId',
      },
    );

    const TestRenderer = () => {
      return (
        <Suspense>
          <ContactCardScreen
            screenId="screenId"
            hasFocus
            route={{
              route: 'CONTACT_CARD',
            }}
            preloadedQuery={preloadedQuery}
          />
        </Suspense>
      );
    };

    return render(
      <RelayEnvironmentProvider environment={environment}>
        <TestRenderer />
      </RelayEnvironmentProvider>,
    );
  };

  test('Should render add to wallet button', () => {
    renderContactCardScreen();
    expect(screen.getByTestId('add-to-wallet-button')).toBeOnTheScreen();
  });

  test('Should call getAppleWallet', () => {
    Platform.OS = 'ios';
    jest.useFakeTimers();
    renderContactCardScreen();
    jest.runAllTimers();

    act(() => {
      fireEvent.press(screen.getByTestId('add-to-wallet-button'));
    });

    expect(getAppleWalletPassMock).toBeCalledTimes(1);
  });

  test('Should call getGoogleWallet', () => {
    Platform.OS = 'android';
    jest.useFakeTimers();
    renderContactCardScreen();
    jest.runAllTimers();

    act(() => {
      fireEvent.press(screen.getByTestId('add-to-wallet-button'));
    });

    expect(getGoogleWalletPassMock).toBeCalledTimes(1);
  });
});
