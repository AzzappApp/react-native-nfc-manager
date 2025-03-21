import * as Sentry from '@sentry/nextjs';
import { GraphQLError } from 'graphql';
import { getSessionInfos } from '#GraphQLContext';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import { extractVisitCardData } from '../extractVisitCardData';

// Mock dependencies
jest.mock('@sentry/nextjs', () => ({
  captureMessage: jest.fn(),
  captureException: jest.fn(),
}));

jest.mock('#GraphQLContext', () => ({
  getSessionInfos: jest.fn(),
}));

jest.mock('#helpers/subscriptionHelpers', () => ({
  validateCurrentSubscription: jest.fn(),
}));

global.fetch = jest.fn();

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('extractVisitCardData', () => {
  const mockArgs = {
    imgUrl: 'https://example.com/image.jpg',
    config: { createContactCard: false },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw UNAUTHORIZED error if user is not authenticated', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: null });

    await expect(
      extractVisitCardData({}, mockArgs, mockContext, mockInfo),
    ).rejects.toThrow(new GraphQLError('UNAUTHORIZED'));

    expect(validateCurrentSubscription).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('should validate subscription if `createContactCard` is false', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-123' });

    await extractVisitCardData({}, mockArgs, mockContext, mockInfo);

    expect(validateCurrentSubscription).toHaveBeenCalledWith('user-123', {
      action: 'USE_SCAN',
    });
  });

  test('should return extracted business card data on valid API response', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-123' });

    const mockApiResponse = {
      choices: [
        {
          message: {
            content:
              '{"firstName":"John","lastName":"Doe","phoneNumbers":["+123456789"],"emails":["john@example.com"],"addresses":["123 Street, City"],"company":"Azzapp","title":"CEO","urls":["https://company.com"]}',
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockApiResponse),
    });

    const result = await extractVisitCardData(
      {},
      mockArgs,
      mockContext,
      mockInfo,
    );

    expect(result).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      phoneNumbers: ['+123456789'],
      emails: ['john@example.com'],
      addresses: ['123 Street, City'],
      company: 'Azzapp',
      title: 'CEO',
      urls: ['https://company.com'],
    });

    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  test('should return extracted business card data on valid API response', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-123' });

    const mockApiResponse = {
      choices: [
        {
          message: {
            content:
              '{"firstName":"John","lastName":"Doe","phoneNumbers":["+123456789"],"emails":["john@example.com ", "john2@example.com", " johnny @example. com "],"addresses":["123 Street, City"],"company":"Azzapp","title":"CEO","urls":["https://company.com"]}',
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockApiResponse),
    });

    const result = await extractVisitCardData(
      {},
      mockArgs,
      mockContext,
      mockInfo,
    );

    expect(result).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      phoneNumbers: ['+123456789'],
      emails: ['john@example.com', 'john2@example.com', 'johnny@example.com'],
      addresses: ['123 Street, City'],
      company: 'Azzapp',
      title: 'CEO',
      urls: ['https://company.com'],
    });
  });

  test('should log exceptions to Sentry if fetch request fails', async () => {
    (getSessionInfos as jest.Mock).mockReturnValue({ userId: 'user-123' });

    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

    const result = await extractVisitCardData(
      {},
      mockArgs,
      mockContext,
      mockInfo,
    );

    expect(result).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      new Error('Network Error'),
    );
  });
});
