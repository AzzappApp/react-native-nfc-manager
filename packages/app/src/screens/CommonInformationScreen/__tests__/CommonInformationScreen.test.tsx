import { Suspense } from 'react';
import { RelayEnvironmentProvider, loadQuery } from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import { render } from '#helpers/testHelpers';
import commonInformationScreenQuery from '#relayArtifacts/CommonInformationScreenQuery.graphql';
import ContactCardEditCompanyLogo from '#screens/ContactCardEditScreen/ContactCardEditCompanyLogo';
import { CommonInformationScreen } from '../CommonInformationScreen';
import type { CommonInformationScreenQuery } from '#relayArtifacts/CommonInformationScreenQuery.graphql';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

// Mock dependencies
jest.mock('#screens/ContactCardEditScreen/ContactCardEditCompanyLogo', () =>
  jest.fn(() => null),
);

jest.mock('react-native-compressor', () => ({ compress: jest.fn() }));

jest.mock('#components/ImagePicker', () => jest.fn(() => null));

describe('CommonInformationScreen - isPremium flag', () => {
  let environment: RelayMockEnvironment;

  const renderCommonInformationScreen = (isPremium: boolean) => {
    environment = createMockEnvironment();
    environment.mock.queuePendingOperation(commonInformationScreenQuery, {
      webCardId: 'testWebCardId',
      pixelRatio: 2,
    });

    environment.mock.queueOperationResolver(operation => {
      return MockPayloadGenerator.generate(operation, {
        WebCard() {
          return {
            id: 'testWebCardId',
            isPremium,
            logo: null,
            commonInformation: {
              company: 'Test Company',
              emails: [],
              phoneNumbers: [],
              urls: [],
              addresses: [],
              socials: [],
            },
          };
        },
      });
    });

    const preloadedQuery = loadQuery<CommonInformationScreenQuery>(
      environment,
      commonInformationScreenQuery,
      {
        webCardId: 'testWebCardId',
        pixelRatio: 2,
      },
    );

    const TestRenderer = () => (
      <Suspense>
        <CommonInformationScreen
          preloadedQuery={preloadedQuery}
          screenId=""
          hasFocus={false}
          route={{
            route: 'COMMON_INFORMATION',
            params: undefined,
          }}
        />
      </Suspense>
    );

    return render(
      <RelayEnvironmentProvider environment={environment}>
        <TestRenderer />
      </RelayEnvironmentProvider>,
    );
  };

  test('Should pass isPremium as true to ContactCardEditCompanyLogo', async () => {
    renderCommonInformationScreen(true);
    await flushPromises();

    expect(ContactCardEditCompanyLogo).toHaveBeenCalledWith(
      expect.objectContaining({ isPremium: true }),
      {},
    );
  });

  test('Should pass isPremium as false to ContactCardEditCompanyLogo', async () => {
    renderCommonInformationScreen(false);
    await flushPromises();

    expect(ContactCardEditCompanyLogo).toHaveBeenCalledWith(
      expect.objectContaining({ isPremium: false }),
      {},
    );
  });
});
