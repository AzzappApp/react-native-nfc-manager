import { getSessionInfos, getSessionUser } from '#GraphQLContext';

jest.mock('#GraphQLContext', () => ({
  getSessionInfos: jest.fn(),
  getSessionUser: jest.fn(),
}));

// Mock implementations
const getSessionInfosMock = getSessionInfos as jest.Mock;
const getSessionUserMock = getSessionUser as jest.Mock;

const mockUser = (userId: string | null | undefined = null) => {
  if (userId) {
    getSessionInfosMock.mockReturnValue({ userId });
    getSessionUserMock.mockReturnValue({ id: userId });
  } else {
    getSessionInfosMock.mockReturnValue({ userId: null });
    getSessionUserMock.mockReturnValue(null);
  }
};

export {
  getSessionInfosMock as getSessionInfos,
  getSessionUserMock as getSessionUser,
  mockUser,
};
