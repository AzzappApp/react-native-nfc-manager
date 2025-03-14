import { parseWithZod } from '@conform-to/zod';
import { jwtDecode } from 'jwt-decode';

import { getProfileByUserAndWebCard, getUserById } from '@azzapp/data';
import { sendEmail } from '@azzapp/shared/emailHelpers';
import { sendTwilioSMS } from '#helpers/twilioHelpers';
import { processShareBackSubmission } from '../shareBackAction';
import type { ShareBackFormData } from '../shareBackAction';
import type { Profile, User } from '@azzapp/data';

jest.mock('@azzapp/data', () => ({
  getUserById: jest.fn(),
}));

jest.mock('@azzapp/shared/emailHelpers', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('#helpers/twilioHelpers', () => ({
  sendTwilioSMS: jest.fn(),
}));

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

jest.mock('@conform-to/zod', () => ({
  parseWithZod: jest.fn(),
}));

jest.mock('jwt-decode', () => ({
  __esModule: true,
  jwtDecode: jest.fn(),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

const jwtDecodeMocked = jwtDecode as jest.MockedFunction<typeof jwtDecode>;
const getUserByIdMocked = getUserById as jest.MockedFunction<
  typeof getUserById
>;
const getProfileByUserAndWebCardMocked =
  getProfileByUserAndWebCard as jest.MockedFunction<
    typeof getProfileByUserAndWebCard
  >;
const parseWithZodMocked = parseWithZod as jest.MockedFunction<any>;

const formData = {
  firstName: 'John',
  lastName: 'Doe',
  title: 'Developer',
  company: 'Tech Inc',
  phone: {
    number: '1234567890',
    countryCode: 'FR',
  },
  email: 'john.doe@example.com',
} as ShareBackFormData;

const shareBackWithSuccessBody = `Hello,

    You've received a new contact ShareBack.
    ${JSON.stringify(formData, null, 2)}.

    Best.`;

const shareBackWithSuccessSubject = 'New Contact ShareBack Received';

describe('processShareBackSubmission', () => {
  const userId = 'user123';
  const webcardId = 'webcard123';
  const token = 'token123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should send an SMS if preferred contact method is SMS', async () => {
    jwtDecodeMocked.mockImplementation(() => ({
      exp: Date.now() / 1000 + 1000,
    }));
    getUserByIdMocked.mockResolvedValue({
      email: 'john.doe@example.com',
      phoneNumber: '1234567890',
      emailConfirmed: false,
      phoneNumberConfirmed: true,
    } as User);
    getProfileByUserAndWebCardMocked.mockResolvedValue({
      id: 'profile123',
    } as Profile);

    parseWithZodMocked.mockReturnValueOnce({
      status: 'success',
      data: formData,
      payload: formData,
      reply: jest.fn().mockReturnValue({
        formErrors: [],
      }),
    });

    await processShareBackSubmission(userId, webcardId, token, null, formData);

    expect(sendTwilioSMS).toHaveBeenCalledWith({
      to: '1234567890',
      body: shareBackWithSuccessBody,
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test('should send an email if preferred contact method is EMAIL', async () => {
    jwtDecodeMocked.mockImplementation(() => ({
      exp: Date.now() / 1000 + 1000,
    }));
    getUserByIdMocked.mockResolvedValue({
      email: 'john.doe@example.com',
      phoneNumber: '1234567890',
      emailConfirmed: true,
      phoneNumberConfirmed: false,
    } as User);
    getProfileByUserAndWebCardMocked.mockResolvedValue({
      id: 'profile123',
    } as Profile);

    parseWithZodMocked.mockReturnValueOnce({
      status: 'success',
      data: formData,
      payload: formData,
      reply: jest.fn().mockReturnValue({
        formErrors: [],
      }),
    });

    await processShareBackSubmission(userId, webcardId, token, null, formData);

    expect(sendEmail).toHaveBeenCalledWith([
      {
        email: 'john.doe@example.com',
        subject: shareBackWithSuccessSubject,
        text: shareBackWithSuccessBody,
        html: shareBackWithSuccessBody,
      },
    ]);
    expect(sendTwilioSMS).not.toHaveBeenCalled();
  });

  test('should reply with form error if token is expired', async () => {
    parseWithZodMocked.mockReturnValueOnce({
      reply: jest.fn().mockImplementation(() => ({
        formErrors: ['Token expired, please refresh and try sharing again'],
      })),
    });

    jwtDecodeMocked.mockImplementation(() => ({
      exp: Date.now() / 1000 - 1000,
    }));

    const result = await processShareBackSubmission(
      userId,
      webcardId,
      token,
      null,
      formData,
    );

    expect(result).toEqual({
      formErrors: ['Token expired, please refresh and try sharing again'],
    });
    expect(getUserById).not.toHaveBeenCalled();
  });
});
