import {
  RelayEnvironmentProvider,
  graphql,
  useLazyLoadQuery,
} from 'react-relay';
import { MockPayloadGenerator } from 'relay-test-utils';
import { createMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';
import { screen, render, fireEvent, act, waitFor } from '#helpers/testHelpers';
import ContactCardEditModal from '../ContactCardEditModal';
import type { ContactCardEditModalProps } from '../ContactCardEditModal';
import type { ContactCardEditModalTestQuery } from '@azzapp/relay/artifacts/ContactCardEditModalTestQuery.graphql';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

describe('ContactCardEditModal', () => {
  let environment: RelayMockEnvironment;

  const renderContactCardEditModal = (
    props?: Partial<ContactCardEditModalProps>,
  ) => {
    environment = createMockEnvironment();
    environment.mock.queueOperationResolver(operation =>
      MockPayloadGenerator.generate(operation, {
        Viewer: () => ({
          id: 'viewerId',
          profile: {
            id: 'profileId',
            contactCard: {
              id: 'contactCardId',
              firstName: 'John',
              lastName: 'Doe',
              title: 'Software Engineer',
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
            },
          },
        }),
      }),
    );

    const TestRenderer = (props?: Partial<ContactCardEditModalProps>) => {
      const data = useLazyLoadQuery<ContactCardEditModalTestQuery>(
        graphql`
          query ContactCardEditModalTestQuery @relay_test_operation {
            viewer {
              profile {
                contactCard {
                  ...ContactCardEditModal_card
                }
              }
            }
          }
        `,
        {},
      );

      return (
        data.viewer.profile && (
          <ContactCardEditModal
            contactCard={data.viewer.profile.contactCard}
            visible
            toggleBottomSheet={() => void 0}
            {...props}
          />
        )
      );
    };

    return render(
      <RelayEnvironmentProvider environment={environment}>
        <TestRenderer {...props} />
      </RelayEnvironmentProvider>,
    );
  };

  test('Should render screen with all infos', () => {
    renderContactCardEditModal();

    expect(screen.getByDisplayValue('John')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Doe')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Software Engineer')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Facebook')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('test@test.com')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('1234567890')).toBeOnTheScreen();
  });

  test('Should submit newly edited contact card', async () => {
    renderContactCardEditModal();

    act(() => {
      fireEvent.changeText(screen.getByDisplayValue('John'), 'John 2');
      fireEvent.changeText(screen.getByDisplayValue('Doe'), 'Doe 2');
      fireEvent.changeText(
        screen.getByDisplayValue('Software Engineer'),
        'Software Engineer 2',
      );
      fireEvent.changeText(screen.getByDisplayValue('Facebook'), 'Facebook 2');
      fireEvent.changeText(
        screen.getByDisplayValue('test@test.com'),
        'test@test.com 2',
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
      ).toHaveLength(3);

      const newPhoneInput = screen.getByDisplayValue('');
      if (newPhoneInput) {
        fireEvent.changeText(newPhoneInput, '1234567890 3');
      }
    });

    const saveButton = screen.getByTestId('save-contact-card');

    act(() => {
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeDefined();
    });

    const operation = environment.mock.getMostRecentOperation();

    expect(operation.request.node.operation.name).toBe(
      'ContactCardEditModalMutation',
    );

    expect(operation.request.variables.input).toEqual({
      firstName: 'John 2',
      lastName: 'Doe 2',
      title: 'Software Engineer 2',
      company: 'Facebook 2',
      emails: [
        {
          label: 'Work',
          address: 'test@test.com 2',
          selected: true,
        },
      ],
      phoneNumbers: [
        {
          label: 'Work',
          number: '1234567890 2',
          selected: true,
        },
        {
          label: 'Home',
          number: '1234567890 3',
          selected: true,
        },
      ],
    });
  });
});
