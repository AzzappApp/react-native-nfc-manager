import { Suspense } from 'react';
import { RelayEnvironmentProvider, loadQuery } from 'react-relay';
import { MockPayloadGenerator } from 'relay-test-utils';
import { createMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';
import { screen, render, fireEvent, act, waitFor } from '#helpers/testHelpers';
import CommonInformationScreenQueryNode from '#relayArtifacts/CommonInformationScreenQuery.graphql';
import { CommonInformationScreen } from '../CommonInformationScreen';
import type { CommonInformationScreenQuery } from '#relayArtifacts/CommonInformationScreenQuery.graphql';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('#components/ScreenModal', () => require('react-native').View);

describe('CommonInformationForm', () => {
  let environment: RelayMockEnvironment;

  const renderCommonInformationForm = () => {
    environment = createMockEnvironment();
    environment.mock.queuePendingOperation(CommonInformationScreenQueryNode, {
      webCardId: 'testWebCardId',
    });
    environment.mock.queueOperationResolver(operation => {
      console.log({ operation });
      return MockPayloadGenerator.generate(operation, {
        WebCard() {
          return {
            id: 'test-webcard',
            logo: null,
            commonInformation: {
              company: 'Facebook',
              emails: [
                {
                  label: 'Work',
                  address: 'test@test.com',
                  selected: true,
                },
              ],
              phoneNumbers: [
                {
                  label: 'Work',
                  number: '1234567890',
                  selected: true,
                },
              ],
              urls: [
                {
                  address: 'https://www.google.com',
                  selected: true,
                },
              ],
            },
          };
        },
      });
    });

    const preloadedQuery = loadQuery<CommonInformationScreenQuery>(
      environment,
      CommonInformationScreenQueryNode,
      {
        webCardId: 'testWebCardId',
      },
    );

    const TestRenderer = () => {
      return (
        <Suspense>
          <CommonInformationScreen
            preloadedQuery={preloadedQuery}
            screenId="screenId"
            hasFocus
            route={{
              route: 'COMMON_INFORMATION',
            }}
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

  test('Should render screen with all infos', () => {
    renderCommonInformationForm();

    expect(screen.getByDisplayValue('Facebook')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('test@test.com')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('1234567890')).toBeOnTheScreen();
  });

  test('Should submit newly edited contact card', async () => {
    renderCommonInformationForm();

    act(() => {
      fireEvent.changeText(screen.getByDisplayValue('Facebook'), 'Facebook 2');
      fireEvent.changeText(
        screen.getByDisplayValue('test@test.com'),
        'test@test.eu',
      );
      fireEvent.changeText(
        screen.getByDisplayValue('1234567890'),
        '1234567890 2',
      );

      fireEvent.press(screen.getByTestId('add-phone-button'));
    });

    act(() => {
      expect(
        screen.getAllByTestId('contact-card-edit-modal-field'),
      ).toHaveLength(6);

      const newPhoneInput = screen.getByDisplayValue('');
      if (newPhoneInput) {
        fireEvent.changeText(newPhoneInput, '1234567890 3');
      }
    });

    const saveButton = screen.getByTestId('save-common-information');

    act(() => {
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeDefined();
    });

    const operation = environment.mock.getMostRecentOperation();

    expect(operation.request.node.operation.name).toBe(
      'CommonInformationScreenMutation',
    );

    expect(operation.request.variables.input).toEqual({
      company: 'Facebook 2',
      logoId: null,
      emails: [
        {
          label: 'Work',
          address: 'test@test.eu',
        },
      ],
      phoneNumbers: [
        {
          label: 'Work',
          number: '1234567890 2',
        },
        {
          label: 'Home',
          number: '1234567890 3',
        },
      ],
      addresses: [
        {
          address: '<mock-value-for-field-"address">',
          label: '<mock-value-for-field-"label">',
        },
      ],
      socials: [
        {
          label: '<mock-value-for-field-"label">',
          url: '<mock-value-for-field-"url">',
        },
      ],
      urls: [
        {
          address: 'https://www.google.com',
        },
      ],
    });
  });
});
