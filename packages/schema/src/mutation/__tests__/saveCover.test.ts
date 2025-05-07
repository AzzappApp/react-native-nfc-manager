import { GraphQLError } from 'graphql';
import { getWebCardPosts, referencesMedias, updateWebCard } from '@azzapp/data';
import { checkMedias } from '@azzapp/service/mediaServices/mediaServices';
import ERRORS from '@azzapp/shared/errors';
import {
  invalidatePost,
  invalidateWebCard,
  notifyWebCardUsers,
} from '#externals';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { notifyRelatedWalletPasses } from '#helpers/webCardHelpers';
import saveCover from '../saveCover';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  checkMedias: jest.fn(),
  getWebCardPosts: jest.fn(),
  referencesMedias: jest.fn(),
  transaction: jest.fn(callback => callback()),
  updateWebCard: jest.fn(),
  createId: jest.fn(() => 'generated-cover-id'),
}));

jest.mock('#externals', () => ({
  invalidatePost: jest.fn(),
  invalidateWebCard: jest.fn(),
  notifyWebCardUsers: jest.fn(),
}));

jest.mock('@azzapp/service/mediaServices/mediaServices', () => ({
  checkMedias: jest.fn(),
}));

jest.mock('#loaders', () => ({
  webCardLoader: {
    load: jest.fn(),
  },
}));

jest.mock('#helpers/permissionsHelpers', () => ({
  checkWebCardProfileEditorRight: jest.fn(),
}));

jest.mock('#helpers/relayIdHelpers', () => jest.fn());

jest.mock('#helpers/webCardHelpers', () => ({
  notifyRelatedWalletPasses: jest.fn(),
}));

// Mock context and info
const mockContext: any = {};
const mockInfo: any = {};

describe('saveCover', () => {
  const mockWebCard = {
    id: 'webcard-123',
    userName: 'testUser',
    coverMediaId: 'old-media-id',
    updatedAt: new Date('2021-01-01'),
  };

  const input = {
    texts: ['Title', 'Subtitle'],
    mediaId: 'new-media-id',
    backgroundColor: '#ffffff',
    cardColors: {
      primary: '#ff0000',
      dark: '#cc0000',
      light: '#ff6666',
      otherColors: [],
    },
    dynamicLinks: {
      color: '#000000',
      links: [{ link: 'https://example.com', position: 0, socialId: 'test' }],
      position: { x: 10, y: 20 },
      rotation: 0,
      size: 14,
      shadow: true,
    },
    coverPreviewPositionPercentage: 50,
    coverIsPredefined: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully save cover with valid inputs', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (checkWebCardProfileEditorRight as jest.Mock).mockResolvedValue({
      profileRole: 'editor',
      userId: 'editor-user-id',
    });
    (webCardLoader.load as jest.Mock).mockResolvedValue(mockWebCard);
    (checkMedias as jest.Mock).mockResolvedValue(undefined);
    (getWebCardPosts as jest.Mock).mockResolvedValue([
      { id: 'post-1' },
      { id: 'post-2' },
    ]);

    const result = await saveCover(
      {},
      { webCardId: 'global-webcard-123', input },
      mockContext,
      mockInfo,
    );

    expect(checkMedias).toHaveBeenCalledWith(['new-media-id']);
    expect(referencesMedias).toHaveBeenCalledWith(
      ['new-media-id'],
      ['old-media-id'],
    );
    expect(updateWebCard).toHaveBeenCalledWith('webcard-123', {
      lastCardUpdate: expect.any(Date),
      updatedAt: expect.any(Date),
      coverMediaId: 'new-media-id',
      coverBackgroundColor: '#ffffff',
      cardColors: {
        primary: '#ff0000',
        dark: '#cc0000',
        light: '#ff6666',
        otherColors: [],
      },
      coverTexts: ['Title', 'Subtitle'],
      coverDynamicLinks: {
        color: '#000000',
        links: [{ link: 'https://example.com', position: 0, socialId: 'test' }],
        position: { x: 10, y: 20 },
        rotation: 0,
        size: 14,
        shadow: true,
      },
      coverPreviewPositionPercentage: 50,
      coverId: 'generated-cover-id',
      coverIsPredefined: true,
      coverIsLogoPredefined: false,
    });

    expect(notifyRelatedWalletPasses).toHaveBeenCalledWith('webcard-123', true);
    expect(invalidateWebCard).toHaveBeenCalledWith('testUser');
    expect(invalidatePost).toHaveBeenCalledTimes(2);
    expect(invalidatePost).toHaveBeenCalledWith('testUser', 'post-1');
    expect(invalidatePost).toHaveBeenCalledWith('testUser', 'post-2');
    expect(notifyWebCardUsers).toHaveBeenCalledWith(
      mockWebCard,
      'editor-user-id',
    );

    expect(result).toEqual({
      webCard: expect.objectContaining({
        id: 'webcard-123',
        coverMediaId: 'new-media-id',
        coverId: 'generated-cover-id',
        lastCardUpdate: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    });
  });

  test('should throw UNAUTHORIZED if user lacks editor rights', async () => {
    (fromGlobalIdWithType as jest.Mock).mockReturnValue('webcard-123');
    (checkWebCardProfileEditorRight as jest.Mock).mockRejectedValue(
      new GraphQLError(ERRORS.UNAUTHORIZED),
    );

    await expect(
      saveCover(
        {},
        { webCardId: 'global-webcard-123', input },
        mockContext,
        mockInfo,
      ),
    ).rejects.toThrow(new GraphQLError(ERRORS.UNAUTHORIZED));

    expect(updateWebCard).not.toHaveBeenCalled();
  });
});
