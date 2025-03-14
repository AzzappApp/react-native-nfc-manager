import { GraphQLError } from 'graphql';

import { createContact, getContactByProfiles } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { notifyUsers } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader, userLoader, webCardLoader } from '#loaders';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import addContact from '../addContact';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  checkMedias: jest.fn(),
  createContact: jest.fn(),
  getContactByProfiles: jest.fn(),
  incrementShareBacks: jest.fn(),
  incrementShareBacksTotal: jest.fn(),
  referencesMedias: jest.fn(),
  transaction: jest.fn(callback => callback()),
  updateContact: jest.fn(),
}));

jest.mock('@azzapp/i18n', () => ({
  guessLocale: jest.fn().mockReturnValue('en'),
}));

jest.mock('@azzapp/shared/urlHelpers', () => ({
  buildUserUrl: jest.fn(userName => `https://azzapp.com/${userName}`),
}));

jest.mock('#externals', () => ({
  notifyUsers: jest.fn(),
  sendPushNotification: jest.fn(),
}));

jest.mock('#GraphQLContext', () => ({
  getSessionInfos: jest.fn(),
}));

jest.mock('#loaders', () => ({
  profileLoader: { load: jest.fn() },
  userLoader: { load: jest.fn() },
  webCardLoader: { load: jest.fn() },
}));

jest.mock('#helpers/subscriptionHelpers', () => ({
  validateCurrentSubscription: jest.fn(),
}));

jest.mock('graphql-relay', () => ({
  fromGlobalId: jest
    .fn()
    .mockImplementation(id => ({ id: id.replace('gql-', '') })),
}));

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('addContact Mutation', () => {
  const mockProfile = {
    id: 'profile-123',
    userId: 'user-456',
    contactCard: {
      addresses: [],
      emails: [],
      phoneNumbers: [],
      urls: [],
      socials: [],
    },
    webCardId: 'webcard-789',
  };

  const mockWebCard = {
    id: 'webcard-789',
    isMultiUser: false,
    userName: 'testUser',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw UNAUTHORIZED if user is not authenticated', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: null });

    await expect(
      addContact(
        {},
        {
          profileId: 'gql-profile-123',
          input: {
            firstname: 'John',
            lastname: 'Doe',
            company: 'Azzapp',
            title: 'CEO',
            phoneNumbers: [],
            emails: [],
            addresses: [],
            withShareBack: false,
          },
          notify: false,
          scanUsed: false,
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));
  });

  test('should throw FORBIDDEN if profile does not belong to the user', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-999' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);

    await expect(
      addContact(
        {},
        {
          profileId: 'gql-profile-123',
          input: {
            firstname: 'John',
            lastname: 'Doe',
            company: 'Azzapp',
            title: 'CEO',
            phoneNumbers: [],
            emails: [],
            addresses: [],
            withShareBack: false,
          },
          notify: false,
          scanUsed: false,
        },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.FORBIDDEN));
  });

  test('should create a new contact if no existing contact found', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (getContactByProfiles as jest.Mock).mockResolvedValue(null);
    (createContact as jest.Mock).mockResolvedValue('contact-123');

    const result = await addContact(
      {},
      {
        profileId: 'gql-profile-123',
        input: {
          firstname: 'John',
          lastname: 'Doe',
          company: 'Azzapp',
          title: 'CEO',
          phoneNumbers: [{ label: 'Work', number: '123456789' }],
          emails: [{ label: 'Work', address: 'john@example.com' }],
          addresses: [{ label: 'Office', address: '123 Street, City' }],
          withShareBack: false,
        },
        notify: false,
        scanUsed: false,
      },
      mockContext,
      mockInfo,
    );

    expect(createContact).toHaveBeenCalled();
    expect(result).toEqual({
      contact: expect.objectContaining({
        id: 'contact-123',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Azzapp',
        title: 'CEO',
      }),
    });
  });

  test('should validate subscription if scan is used', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (getContactByProfiles as jest.Mock).mockResolvedValue(null);
    (createContact as jest.Mock).mockResolvedValue('contact-789');

    await addContact(
      {},
      {
        profileId: 'gql-profile-123',
        input: {
          firstname: 'John',
          lastname: 'Doe',
          company: 'Azzapp',
          title: 'CEO',
          phoneNumbers: [{ label: 'Work', number: '123456789' }],
          emails: [{ label: 'Work', address: 'john@example.com' }],
          addresses: [{ label: 'Office', address: '123 Street, City' }],
          withShareBack: false,
        },
        notify: false,
        scanUsed: true,
      },
      mockContext,
      mockInfo,
    );

    expect(validateCurrentSubscription).toHaveBeenCalledWith('user-456', {
      action: 'ADD_CONTACT_WITH_SCAN',
    });
  });

  test('should send email notification if notify is true', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-456' });
    (profileLoader.load as jest.Mock).mockResolvedValue(mockProfile);
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (userLoader.load as jest.Mock).mockResolvedValue({
      userId: 'user-456',
      locale: 'en',
    });

    await addContact(
      {},
      {
        profileId: 'gql-profile-123',
        input: {
          firstname: 'John',
          lastname: 'Doe',
          company: 'Azzapp',
          title: 'CEO',
          phoneNumbers: [{ label: 'Work', number: '123456789' }],
          emails: [{ label: 'Work', address: 'john@example.com' }],
          addresses: [{ label: 'Office', address: '123 Street, City' }],
          withShareBack: false,
        },
        notify: true,
        scanUsed: false,
      },
      mockContext,
      mockInfo,
    );

    expect(notifyUsers).toHaveBeenCalledWith(
      'email',
      ['john@example.com'],
      mockWebCard,
      'vcard',
      'en',
      expect.any(Object),
    );
  });
});
