import { getUserById } from '@azzapp/data';
import { sendTemplateEmail } from '@azzapp/shared/emailHelpers';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import serializeAndSignEmailSignature from '@azzapp/shared/serializeAndSignEmailSignature';
import { buildEmailSignatureGenerationUrl } from '@azzapp/shared/urlHelpers';
import { generateEmailSignature } from '../emailSignatureServices';
import { buildAvatarUrl } from '../mediaServices';
import type { Profile, WebCard } from '@azzapp/data';

jest.mock('../mediaServices', () => ({
  buildAvatarUrl: jest.fn(),
  buildLogoUrl: jest.fn(),
}));

jest.mock('@azzapp/data', () => ({
  getUserById: jest.fn(),
}));

jest.mock('@azzapp/shared/emailHelpers', () => ({
  sendTemplateEmail: jest.fn(),
}));

jest.mock('@azzapp/shared/serializeAndSignContactCard', () => jest.fn());
jest.mock('@azzapp/shared/serializeAndSignEmailSignature', () => jest.fn());
jest.mock('@azzapp/shared/urlHelpers', () => ({
  buildEmailSignatureGenerationUrl: jest.fn(),
}));

const mockIntl = {
  formatMessage: ({ defaultMessage }: any) => defaultMessage,
} as any;

const baseProfile: Profile = {
  id: 'profile-1',
  userId: 'user-1',
  contactCard: { firstName: 'John Doe' },
  webCardId: '',
  profileRole: 'owner',
  invited: false,
  invitedBy: null,
  inviteSent: false,
  promotedAsOwner: false,
  avatarId: null,
  logoId: null,
  contactCardIsPrivate: false,
  contactCardDisplayedOnWebCard: false,
  createdAt: new Date(),
  lastContactCardUpdate: new Date(),
  nbContactCardScans: 0,
  nbContactsImportFromScan: 0,
  nbShareBacks: 0,
  deleted: false,
  deletedAt: null,
  deletedBy: null,
  lastContactViewAt: new Date(),
  hasGooglePass: false,
};

const baseWebCard: WebCard = {
  id: 'webcard-1',
  userName: 'johndoe',
  isMultiUser: false,
  lastUserNameUpdate: new Date(),
  webCardKind: 'personal',
  firstName: null,
  lastName: null,
  logoId: null,
  commonInformation: null,
  companyName: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  locale: null,
  cardColors: null,
  cardStyle: null,
  cardIsPrivate: false,
  cardIsPublished: false,
  alreadyPublished: false,
  lastCardUpdate: new Date(),
  coverId: '',
  coverMediaId: null,
  coverTexts: null,
  coverBackgroundColor: null,
  coverDynamicLinks: {
    links: [],
    color: '',
    size: 0,
    position: {
      x: 0,
      y: 0,
    },
    rotation: 0,
    shadow: false,
  },
  coverIsPredefined: false,
  coverIsLogoPredefined: false,
  coverPreviewPositionPercentage: null,
  companyActivityLabel: null,
  nbFollowers: 0,
  nbFollowings: 0,
  nbPosts: 0,
  nbPostsLiked: 0,
  nbLikes: 0,
  nbWebCardViews: 0,
  starred: false,
  deleted: false,
  deletedAt: null,
  deletedBy: null,
};

describe('generateEmailSignature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws if webCard.userName is missing', async () => {
    await expect(
      generateEmailSignature({
        webCard: { ...baseWebCard, userName: undefined as any },
        profile: baseProfile,
        intl: mockIntl,
      }),
    ).rejects.toThrow('User name is required');
  });

  it('throws if profile.contactCard is missing', async () => {
    await expect(
      generateEmailSignature({
        webCard: baseWebCard,
        profile: { ...baseProfile, contactCard: undefined as any },
        intl: mockIntl,
      }),
    ).rejects.toThrow('Contact card is required');
  });

  it('returns the generated URL and sends email', async () => {
    (buildAvatarUrl as jest.Mock).mockResolvedValue('https://avatar.url');
    (serializeAndSignEmailSignature as jest.Mock).mockResolvedValue({
      data: 'sig-data',
      signature: 'sig-signature',
    });
    (serializeAndSignContactCard as jest.Mock).mockResolvedValue({
      data: 'card-data',
      signature: 'card-signature',
    });
    (buildEmailSignatureGenerationUrl as jest.Mock).mockReturnValue(
      'https://signature.url',
    );
    (getUserById as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

    const result = await generateEmailSignature({
      webCard: baseWebCard,
      profile: baseProfile,
      intl: mockIntl,
    });

    expect(buildAvatarUrl).toHaveBeenCalled();
    expect(serializeAndSignEmailSignature).toHaveBeenCalled();
    expect(serializeAndSignContactCard).toHaveBeenCalled();
    expect(buildEmailSignatureGenerationUrl).toHaveBeenCalledWith(
      'johndoe',
      'sig-data',
      'sig-signature',
      'card-data',
      'card-signature',
    );
    expect(sendTemplateEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipients: [
          expect.objectContaining({
            to: 'test@example.com',
          }),
        ],
      }),
    );
    expect(result).toBe('https://signature.url');
  });

  it('skips sending email if user has no email', async () => {
    (buildAvatarUrl as jest.Mock).mockResolvedValue('https://avatar.url');
    (serializeAndSignEmailSignature as jest.Mock).mockResolvedValue({
      data: 'sig-data',
      signature: 'sig-signature',
    });
    (serializeAndSignContactCard as jest.Mock).mockResolvedValue({
      data: 'card-data',
      signature: 'card-signature',
    });
    (buildEmailSignatureGenerationUrl as jest.Mock).mockReturnValue(
      'https://signature.url',
    );
    (getUserById as jest.Mock).mockResolvedValue({});

    const result = await generateEmailSignature({
      webCard: baseWebCard,
      profile: baseProfile,
      intl: mockIntl,
    });

    expect(sendTemplateEmail).not.toHaveBeenCalled();
    expect(result).toBe('https://signature.url');
  });
});
