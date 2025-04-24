import ShareCommand from 'react-native-share';
import {
  RelayEnvironmentProvider,
  graphql,
  useLazyLoadQuery,
} from 'react-relay';
import { MockPayloadGenerator } from 'relay-test-utils';
import { createMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';
import { buildUserUrlWithKey } from '@azzapp/shared/urlHelpers';
import { screen, render, fireEvent, act } from '#helpers/testHelpers';
import ContactCardExportVcf from '../ContactCardExportVcf';
import type { ContactCardExportVcfTestQuery } from '#relayArtifacts/ContactCardExportVcfTestQuery.graphql';
import type { ContactCardExportVcfProps } from '../ContactCardExportVcf';
import type { RelayMockEnvironment } from 'relay-test-utils/lib/RelayModernMockEnvironment';

jest.mock('react-native-share', () => ({ open: jest.fn() }));

jest.mock('react-native-quick-base64', () => ({
  fromByteArray: jest.fn(),
}));

jest.mock('react-native-blob-jsi-helper', () => ({
  getArrayBufferForBlob: jest.fn(),
}));

const openMock = ShareCommand.open as jest.MockedFunction<
  typeof ShareCommand.open
>;

const contactCard = {
  firstName: 'John',
  lastName: 'Doe',
  emails: [
    {
      address: 'test@mail.com',
      label: 'Work',
      selected: true,
    },
  ],
  phoneNumbers: [
    {
      number: '123456789',
      label: 'Mobile',
      selected: true,
    },
  ],
  urls: [
    {
      address: 'https://www.google.com',
      label: 'Website',
      selected: true,
    },
  ],
  socials: [
    {
      url: 'https://www.facebook.com',
      label: 'Facebook',
      selected: true,
    },
  ],
};

const FIXED_SYSTEM_TIME = '2020-11-18T00:00:00Z';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(Date.parse(FIXED_SYSTEM_TIME));
});

describe('ContactCardExportVcf', () => {
  let environment: RelayMockEnvironment;

  const renderContactCardExportVcf = (
    props?: Partial<ContactCardExportVcfProps>,
  ) => {
    environment = createMockEnvironment();
    environment.mock.queueOperationResolver(operation => {
      return MockPayloadGenerator.generate(operation, {
        Profile() {
          return {
            contactCardAccessId: 'contactCardAccessId',
            contactCard,
            webCard: {
              userName: 'userName',
            },
          };
        },
      });
    });

    const TestRenderer = (props?: Partial<ContactCardExportVcfProps>) => {
      const data = useLazyLoadQuery<ContactCardExportVcfTestQuery>(
        graphql`
          query ContactCardExportVcfTestQuery @relay_test_operation {
            profile: node(id: "test-profile") {
              ...ContactCardExportVcf_card
            }
          }
        `,
        {},
      );

      return (
        data.profile && (
          <ContactCardExportVcf
            profile={data.profile}
            publicKey="publicKey"
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

  test('Should render export button info', () => {
    renderContactCardExportVcf();

    expect(screen.getByRole('button')).toBeOnTheScreen();
  });

  test('Should share contact card', async () => {
    renderContactCardExportVcf();

    openMock.mockResolvedValueOnce({
      dismissedAction: false,
      success: true,
      message: 'success',
    });

    act(() => {
      fireEvent.press(screen.getByRole('button'));
    });

    expect(openMock).toHaveBeenCalledWith({
      title: 'John Doe',
      subject: 'John Doe',
      failOnCancel: false,
      message: buildUserUrlWithKey({
        userName: 'userName',
        contactCardAccessId: 'contactCardAccessId',
        key: 'publicKey',
      }),
    });
  });
});
