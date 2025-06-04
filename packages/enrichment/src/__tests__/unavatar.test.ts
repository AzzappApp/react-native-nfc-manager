import { getUserNameFromUrl } from '@azzapp/shared/socialLinkHelpers';
import { evaluateExpr } from '../helpers';
import { uploadMedia } from '../media';
import { unAvatar } from '../provider/unavatar';

jest.mock('../media', () => ({
  uploadMedia: jest.fn(),
}));

jest.mock('@azzapp/shared/socialLinkHelpers', () => ({
  getUserNameFromUrl: jest.fn(),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('unAvatar resolver', () => {
  const mockBlob = new Blob(['mock data']);
  const socials = [
    {
      label: 'github' as const,
      url: 'https://github.com/testuser',
    },
    {
      label: 'facebook' as const, // ignored
      url: 'https://facebook.com/irrelevant',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return avatarId when fetch and upload succeed', async () => {
    (getUserNameFromUrl as jest.Mock).mockReturnValue('testuser');

    mockFetch.mockResolvedValue({
      ok: true,
      blob: async () => mockBlob,
    });

    (uploadMedia as jest.Mock).mockResolvedValue('media123');

    const result = await unAvatar.run({ contact: { socials } });

    expect(getUserNameFromUrl).toHaveBeenCalledWith(
      'https://github.com/testuser',
    );
    expect(fetch).toHaveBeenCalledWith(
      'https://unavatar.io/github/testuser?fallback=false',
    );
    expect(uploadMedia).toHaveBeenCalledWith(mockBlob);

    expect(result).toEqual({
      data: {
        contact: {
          avatarId: 'media123',
        },
      },
    });
  });

  it('should return empty data if fetch fails', async () => {
    (getUserNameFromUrl as jest.Mock).mockReturnValue('testuser');

    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const result = await unAvatar.run({ contact: { socials } });

    expect(result).toEqual({});
  });

  it('should return null if getUserNameFromUrl fails', async () => {
    (getUserNameFromUrl as jest.Mock).mockReturnValue(null);

    const result = await unAvatar.run({ contact: { socials } });

    expect(result).toEqual({});
  });

  it('should skip non-unavatar socials', async () => {
    const onlyUnsupportedSocials = [
      {
        label: 'facebook' as const,
        url: 'https://facebook.com/irrelevant',
      },
    ];

    const result = await unAvatar.run({
      contact: { socials: onlyUnsupportedSocials },
    });

    expect(result).toEqual({});
    expect(getUserNameFromUrl).not.toHaveBeenCalled();
  });

  it('returns false for so socials', () => {
    const expr = unAvatar.dependsOn;
    expect(
      evaluateExpr(
        {
          contact: {
            socials: undefined,
          },
        },
        expr,
      ),
    ).toBe(false);
  });
});
