import { IntlProvider } from 'react-intl';
import { RelayEnvironmentProvider } from 'react-relay';
import { createMockEnvironment } from 'relay-test-utils';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { messages } from '#helpers/localeHelpers';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import AcceptTermsOfUseModal from '../AcceptTermsOfUseModal/AcceptTermsOfUseModal';
import type { AcceptTermsOfUseModalProps } from '../AcceptTermsOfUseModal/AcceptTermsOfUseModal';

const TERMS_OF_SERVICE = process.env.TERMS_OF_SERVICE;
const PRIVACY_POLICY = process.env.PRIVACY_POLICY;

const mockOpenUrl = jest.fn();
const mockAccept = jest.fn();
const mockSignOut = jest.fn();

jest.mock('#hooks/useSignOut', () => () => mockSignOut);
jest.mock('#hooks/useAcceptTermsOfUseMutation', () => () => [mockAccept]);

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL(url: string) {
    return mockOpenUrl(url);
  },
}));

const renderAcceptTermsOfUseModal = (props: AcceptTermsOfUseModalProps) => {
  const environment = createMockEnvironment();

  const component = render(
    <RelayEnvironmentProvider environment={environment}>
      <IntlProvider
        locale={DEFAULT_LOCALE}
        defaultLocale={DEFAULT_LOCALE}
        messages={messages[DEFAULT_LOCALE]}
        onError={() => {}}
      >
        <AcceptTermsOfUseModal {...props} />
      </IntlProvider>
    </RelayEnvironmentProvider>,
  );

  return component;
};

describe('AcceptTermsOfUseModal', () => {
  test('should call openURL TERMS_OF_SERVICE', async () => {
    renderAcceptTermsOfUseModal({ visible: true });
    const button = screen.getAllByRole('button')[0];

    act(() => {
      fireEvent.press(button);
      expect(mockOpenUrl).toHaveBeenCalledWith(TERMS_OF_SERVICE);
      expect(mockOpenUrl).not.toHaveBeenCalledWith(PRIVACY_POLICY);
    });
  });

  test('should call openURL PRIVACY_POLICY', async () => {
    renderAcceptTermsOfUseModal({ visible: true });
    const button = screen.getAllByRole('button')[1];

    act(() => {
      fireEvent.press(button);
      expect(mockOpenUrl).toHaveBeenCalledWith(PRIVACY_POLICY);
      expect(mockOpenUrl).not.toHaveBeenCalledWith(TERMS_OF_SERVICE);
    });
  });

  test('should call accept Terms of service', async () => {
    renderAcceptTermsOfUseModal({ visible: true });
    const button = screen.getAllByRole('button')[2];

    act(() => {
      fireEvent.press(button);
      expect(mockAccept).toHaveBeenCalled();
    });
  });

  test('should call Logout', async () => {
    const { getByTestId } = renderAcceptTermsOfUseModal({ visible: true });
    const button = getByTestId('logout');

    act(() => {
      fireEvent.press(button);
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
