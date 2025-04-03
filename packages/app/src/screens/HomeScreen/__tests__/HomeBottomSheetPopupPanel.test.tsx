import { act } from '@testing-library/react-hooks';
import { fireEvent, render } from '@testing-library/react-native';
import { IntlProvider } from 'react-intl';
import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
} from 'react-relay';
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { screen } from '#helpers/testHelpers';
import { TooltipProvider } from '#helpers/TooltipContext';
import HomeBottomSheetPopupPanel from '../HomeBottomSheetPopupPanel';
import type { HomeBottomSheetPopupPanelTestQuery } from '#relayArtifacts/HomeBottomSheetPopupPanelTestQuery.graphql';
import type { HomeBottomSheetPopupPanelProps } from '../HomeBottomSheetPopupPanel';

describe('HomeBottomSheetPopupPanel', () => {
  let environment: ReturnType<typeof createMockEnvironment>;

  const renderHomeBottomSheetPopupPanel = (
    props?: Partial<HomeBottomSheetPopupPanelProps>,
  ) => {
    environment = createMockEnvironment();
    environment.mock.queueOperationResolver(operation =>
      MockPayloadGenerator.generate(operation, {
        Profile(_, generateId) {
          return {
            id: String(generateId()),
            webCard: {
              id: 'test-webCard',
              userName: null,
            },
          };
        },
      }),
    );

    const TestRenderer = (props?: Partial<HomeBottomSheetPopupPanelProps>) => {
      const data = useLazyLoadQuery<HomeBottomSheetPopupPanelTestQuery>(
        graphql`
          query HomeBottomSheetPopupPanelTestQuery @relay_test_operation {
            profile: node(id: "test-post") {
              id
              ...HomeBottomSheetPopupPanel_profile
            }
          }
        `,
        {},
      );
      return <HomeBottomSheetPopupPanel {...props} profile={data.profile!} />;
    };
    const component = render(
      <IntlProvider locale="en">
        <TooltipProvider>
          <RelayEnvironmentProvider environment={environment}>
            <TestRenderer {...props} />
          </RelayEnvironmentProvider>
        </TooltipProvider>
      </IntlProvider>,
    );

    return {
      rerender(updates?: Partial<HomeBottomSheetPopupPanelProps>) {
        component.rerender(
          <IntlProvider locale="en">
            <TooltipProvider>
              <RelayEnvironmentProvider environment={environment}>
                <TestRenderer {...updates} />
              </RelayEnvironmentProvider>
            </TooltipProvider>
          </IntlProvider>,
        );
      },
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render HomeBottomSheetPopupPanel', async () => {
    renderHomeBottomSheetPopupPanel();

    const nextButton = screen.getByTestId(
      'home-bottom-sheet-popup-panel-next-button',
    );

    expect(nextButton).toBeTruthy();

    act(() => {
      fireEvent.press(nextButton);
    });

    act(() => {
      fireEvent.press(nextButton);
    });

    const textInput = screen.getByTestId(
      'home-bottom-sheet-popup-panel-link-input',
    );

    expect(textInput).toBeTruthy();

    // Enter a new username
    const newUserName = 'newusername';
    act(() => {
      fireEvent.changeText(textInput, newUserName);
    });

    // Verify the update has occurred
    expect(screen.getByText(`azzapp.com/${newUserName}`)).toBeTruthy();

    expect(
      environment.mock.getMostRecentOperation().request.node.operation.name,
    ).toBe('HomeBottomSheetPopupPanelCheckUserNameQuery');

    act(() => {
      environment.mock.resolveMostRecentOperation(operation => {
        return MockPayloadGenerator.generate(operation, {
          CheckUserName() {
            return {
              isUserNameAvailable: true,
              username: newUserName,
            };
          },
        });
      });
    });

    // Click the final confirmation button
    act(() => {
      fireEvent.press(nextButton);
    });

    // Ensure the mutation is triggered with the correct variables
    expect(
      environment.mock.getMostRecentOperation().request.node.operation.name,
    ).toBe('HomeBottomSheetPopupPanelMutation');

    expect(
      environment.mock.getMostRecentOperation().request.variables,
    ).toMatchObject({
      webCardId: 'test-webCard',
      input: { userName: newUserName },
    });

    // Resolve the mutation
    act(() => {
      environment.mock.resolveMostRecentOperation(operation =>
        MockPayloadGenerator.generate(operation, {
          UpdateWebCardPayload() {
            return {
              webCard: {
                id: 'test-webCard',
                userName: newUserName,
              },
            };
          },
        }),
      );
    });
  });
});
