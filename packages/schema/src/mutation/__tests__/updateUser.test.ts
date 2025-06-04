import * as bcrypt from 'bcrypt-ts';
import { GraphQLError } from 'graphql';
import { getUserByEmail, getUserByPhoneNumber, updateUser } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { validateMailOrPhone } from '#externals';
import { userLoader } from '#loaders';
import { mockUser } from '../../../__mocks__/mockGraphQLContext';
import updateUserMutation from '../updateUser';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getUserByEmail: jest.fn(),
  getUserByPhoneNumber: jest.fn(),
  updateUser: jest.fn(),
  transaction: jest.fn(fn => fn()),
}));

jest.mock('@azzapp/shared/stringHelpers', () => ({
  formatPhoneNumber: jest.fn(phone => `formatted-${phone}`),
  isInternationalPhoneNumber: jest.fn(() => true),
}));

jest.mock('#externals', () => ({
  validateMailOrPhone: jest.fn(),
}));

jest.mock('#loaders', () => ({
  userLoader: {
    load: jest.fn(),
  },
}));

jest.mock('bcrypt-ts', () => ({
  compareSync: jest.fn(),
  hashSync: jest.fn(() => 'hashed-password'),
}));

const mockContext: any = {};
const mockInfo: any = {};

describe('updateUserMutation', () => {
  const mockedUser = {
    id: 'user-1',
    email: 'old@example.com',
    phoneNumber: '1234567890',
    password: 'hashed-password',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser('user-1');
  });

  test('should return null if user is not authenticated', async () => {
    mockUser();

    const result = await updateUserMutation(
      {},
      { input: {} },
      mockContext,
      mockInfo,
    );

    expect(result).toBeNull();
    expect(userLoader.load).not.toHaveBeenCalled();
  });

  test('should throw INVALID_REQUEST if user is not found', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(null);

    await expect(
      updateUserMutation({}, { input: {} }, mockContext, mockInfo),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });

  test('should allow updating email if existingUser is deleted', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);
    (validateMailOrPhone as jest.Mock).mockResolvedValue(true);
    (getUserByEmail as jest.Mock).mockResolvedValue({
      id: 'user-2',
      deleted: true,
    });

    const result = await updateUserMutation(
      {},
      { input: { email: 'new@example.com', token: 'valid-token' } },
      mockContext,
      mockInfo,
    );

    expect(validateMailOrPhone).toHaveBeenCalledWith(
      'email',
      'new@example.com',
      'valid-token',
    );
    expect(updateUser).toHaveBeenCalledWith('user-1', {
      email: 'new@example.com',
      emailConfirmed: true,
    });
    expect(result).toEqual({
      user: { ...mockedUser, email: 'new@example.com', emailConfirmed: true },
    });
  });

  test('should allow updating phoneNumber if existingUser is deleted', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);
    (validateMailOrPhone as jest.Mock).mockResolvedValue(true);
    (getUserByPhoneNumber as jest.Mock).mockResolvedValue({
      id: 'user-2',
      deleted: true,
    });

    const result = await updateUserMutation(
      {},
      { input: { phoneNumber: '9876543210', token: 'valid-token' } },
      mockContext,
      mockInfo,
    );

    expect(validateMailOrPhone).toHaveBeenCalledWith(
      'phone',
      '9876543210',
      'valid-token',
    );
    expect(updateUser).toHaveBeenCalledWith('user-1', {
      phoneNumber: 'formatted-9876543210',
      phoneNumberConfirmed: true,
    });
    expect(result).toEqual({
      user: {
        ...mockedUser,
        phoneNumber: 'formatted-9876543210',
        phoneNumberConfirmed: true,
      },
    });
  });

  test('should not throw EMAIL_ALREADY_EXISTS if existing user is deleted', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);
    (getUserByEmail as jest.Mock).mockResolvedValue({
      id: 'user-2',
      deleted: true,
    });

    const result = await updateUserMutation(
      {},
      { input: { email: 'deleted@example.com', token: 'valid-token' } },
      mockContext,
      mockInfo,
    );

    expect(result).toEqual({
      user: {
        ...mockedUser,
        email: 'deleted@example.com',
        emailConfirmed: true,
      },
    });
    expect(updateUser).toHaveBeenCalledWith('user-1', {
      email: 'deleted@example.com',
      emailConfirmed: true,
    });
  });

  test('should not throw PHONENUMBER_ALREADY_EXISTS if existing user is deleted', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);
    (getUserByPhoneNumber as jest.Mock).mockResolvedValue({
      id: 'user-2',
      deleted: true,
    });

    const result = await updateUserMutation(
      {},
      { input: { phoneNumber: '9876543210', token: 'valid-token' } },
      mockContext,
      mockInfo,
    );

    expect(result).toEqual({
      user: {
        ...mockedUser,
        phoneNumber: 'formatted-9876543210',
        phoneNumberConfirmed: true,
      },
    });
    expect(updateUser).toHaveBeenCalledWith('user-1', {
      phoneNumber: 'formatted-9876543210',
      phoneNumberConfirmed: true,
    });
  });

  test('should throw EMAIL_ALREADY_EXISTS if existing user is not deleted', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);
    (getUserByEmail as jest.Mock).mockResolvedValue({
      id: 'user-2',
      deleted: false,
    });

    await expect(
      updateUserMutation(
        {},
        { input: { email: 'existing@example.com', token: 'valid-token' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.EMAIL_ALREADY_EXISTS));
  });

  test('should throw PHONENUMBER_ALREADY_EXISTS if existing user is not deleted', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);
    (getUserByPhoneNumber as jest.Mock).mockResolvedValue({
      id: 'user-2',
      deleted: false,
    });

    await expect(
      updateUserMutation(
        {},
        { input: { phoneNumber: '9876543210', token: 'valid-token' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.PHONENUMBER_ALREADY_EXISTS));
  });

  test('should validate email token and update email', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);
    (validateMailOrPhone as jest.Mock).mockResolvedValue(true);
    (getUserByEmail as jest.Mock).mockResolvedValue(null);

    const result = await updateUserMutation(
      {},
      { input: { email: 'new@example.com', token: 'valid-token' } },
      mockContext,
      mockInfo,
    );

    expect(validateMailOrPhone).toHaveBeenCalledWith(
      'email',
      'new@example.com',
      'valid-token',
    );
    expect(updateUser).toHaveBeenCalledWith('user-1', {
      email: 'new@example.com',
      emailConfirmed: true,
    });
    expect(result).toEqual({
      user: { ...mockedUser, email: 'new@example.com', emailConfirmed: true },
    });
  });

  test('should remove email when set to null', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);

    const result = await updateUserMutation(
      {},
      { input: { email: null } },
      mockContext,
      mockInfo,
    );

    expect(updateUser).toHaveBeenCalledWith('user-1', { email: null });
    expect(result).toEqual({ user: { ...mockedUser, email: null } });
  });

  test('should validate phone number and update it', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);
    (validateMailOrPhone as jest.Mock).mockResolvedValue(true);
    (getUserByPhoneNumber as jest.Mock).mockResolvedValue(null);

    const result = await updateUserMutation(
      {},
      { input: { phoneNumber: '9876543210', token: 'valid-token' } },
      mockContext,
      mockInfo,
    );

    expect(validateMailOrPhone).toHaveBeenCalledWith(
      'phone',
      '9876543210',
      'valid-token',
    );
    expect(updateUser).toHaveBeenCalledWith('user-1', {
      phoneNumber: 'formatted-9876543210',
      phoneNumberConfirmed: true,
    });
    expect(result).toEqual({
      user: {
        ...mockedUser,
        phoneNumber: 'formatted-9876543210',
        phoneNumberConfirmed: true,
      },
    });
  });

  test('should throw EMAIL_ALREADY_EXISTS if email is already taken', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);
    (getUserByEmail as jest.Mock).mockResolvedValue({ id: 'user-2' });

    await expect(
      updateUserMutation(
        {},
        { input: { email: 'existing@example.com', token: 'valid-token' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.EMAIL_ALREADY_EXISTS));
  });

  test('should update password if current password is correct', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

    const result = await updateUserMutation(
      {},
      { input: { currentPassword: 'old-pass', newPassword: 'new-pass' } },
      mockContext,
      mockInfo,
    );

    expect(updateUser).toHaveBeenCalledWith('user-1', {
      password: 'hashed-password',
    });
    expect(result).toEqual({
      user: { ...mockedUser, password: 'hashed-password' },
    });
  });

  test('should throw INVALID_CREDENTIALS if current password is incorrect', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);
    (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

    await expect(
      updateUserMutation(
        {},
        { input: { currentPassword: 'wrong-pass', newPassword: 'new-pass' } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_CREDENTIALS));
  });

  test('should not check current password when no password in database', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue({
      ...mockedUser,
      password: null,
    });
    (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

    const result = await updateUserMutation(
      {},
      { input: { currentPassword: 'old-pass', newPassword: 'new-pass' } },
      mockContext,
      mockInfo,
    );

    expect(updateUser).toHaveBeenCalledWith('user-1', {
      password: 'hashed-password',
    });
    expect(result).toEqual({
      user: { ...mockedUser, password: 'hashed-password' },
    });
  });

  test('should throw INVALID_REQUEST if user would have no email or phone', async () => {
    mockUser('user-1');
    (userLoader.load as jest.Mock).mockResolvedValue(mockedUser);

    await expect(
      updateUserMutation(
        {},
        { input: { email: null, phoneNumber: null } },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.INVALID_REQUEST));
  });
});
