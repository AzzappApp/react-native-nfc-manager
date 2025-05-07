import { getMediasByIds } from '@azzapp/data';
import {
  buildAvatarUrl,
  buildBannerUrl,
  buildCoverImageUrl,
  buildLogoUrl,
} from '../mediaServices';
import type { Profile, WebCard } from '@azzapp/data';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getMediasByIds: jest.fn(),
}));

const mockProfile: Profile = {
  id: 'profile-123',
  userId: 'user-456',
  webCardId: 'webcard-789',
  avatarId: 'avatar-image-id',
  logoId: 'logo-image-id',
  bannerId: 'banner-image-id',
  contactCard: {
    firstName: 'John',
    lastName: 'Doe',
    company: 'Azzapp Inc',
    phoneNumbers: [{ label: 'Work', number: '1234567890' }],
  },
  profileRole: 'owner',
  invited: false,
  invitedBy: null,
  inviteSent: false,
  promotedAsOwner: false,
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

const mockWebCard: WebCard = {
  id: 'webcard-789',
  userName: 'testUser',
  isMultiUser: false,
  coverMediaId: 'cover-image-id',
  cardIsPublished: true,
  coverPreviewPositionPercentage: 20,
  commonInformation: {
    phoneNumbers: [{ label: 'Work', number: '1234567890' }],
    emails: [{ label: 'Work', address: 'test@example.com' }],
  },
  logoId: null,
  bannerId: null,
  createdAt: new Date(),
  deleted: false,
  deletedAt: null,
  deletedBy: null,
  lastUserNameUpdate: new Date(),
  webCardKind: 'personal',
  firstName: null,
  lastName: null,
  companyName: null,
  updatedAt: new Date(),
  locale: null,
  cardColors: null,
  cardStyle: null,
  cardIsPrivate: false,
  alreadyPublished: false,
  lastCardUpdate: new Date(),
  coverId: '',
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
  companyActivityLabel: null,
  nbFollowers: 0,
  nbFollowings: 0,
  nbPosts: 0,
  nbPostsLiked: 0,
  nbLikes: 0,
  nbWebCardViews: 0,
  starred: false,
};

describe('buildAvatarUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should build avatar URL from profile avatarId', async () => {
    const url = await buildAvatarUrl(mockProfile, null);
    expect(url).toBe(
      'https://res.cloudinary.com/azzapp-dev/image/upload/c_fill,w_720/v1/avatar-image-id.jpg',
    );
  });

  test('should fallback to logoId if avatarId is missing', async () => {
    const url = await buildAvatarUrl({ ...mockProfile, avatarId: null }, null);
    expect(url).toBe(
      'https://res.cloudinary.com/azzapp-dev/image/upload/c_fill,w_720/v1/logo-image-id.jpg',
    );
  });
});

describe('buildCoverImageUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return correct image URL for a cover image', async () => {
    (getMediasByIds as jest.Mock).mockResolvedValue([{ kind: 'image' }]);

    const url = await buildCoverImageUrl(mockWebCard, {
      width: 720,
      height: 720,
      crop: 'fill',
    });

    expect(url).toBe(
      'https://res.cloudinary.com/azzapp-dev/image/upload/c_fill,g_east,w_720,h_720,ar_1:1/cover-image-id.png',
    );
  });

  test('should return correct video URL with preview position', async () => {
    (getMediasByIds as jest.Mock).mockResolvedValue([{ kind: 'video' }]);

    const url = await buildCoverImageUrl(mockWebCard, {
      width: 720,
      height: 720,
      crop: 'fill',
    });

    expect(url).toBe(
      'https://res.cloudinary.com/azzapp-dev/video/upload/so_20p/c_fill,g_east,w_720,h_720,ar_1:1/cover-image-id.png',
    );
  });

  test('should return default preview position for video if none is provided', async () => {
    (getMediasByIds as jest.Mock).mockResolvedValue([{ kind: 'video' }]);

    const url = await buildCoverImageUrl(
      { ...mockWebCard, coverPreviewPositionPercentage: null },
      { width: 720, height: 720, crop: 'fill' },
    );

    expect(url).toBe(
      'https://res.cloudinary.com/azzapp-dev/video/upload/so_17p/c_fill,g_east,w_720,h_720,ar_1:1/cover-image-id.png',
    );
  });

  test('should return undefined if no coverMediaId exists', async () => {
    const url = await buildCoverImageUrl(
      { ...mockWebCard, coverMediaId: null },
      { width: 720, height: 720, crop: 'fill' },
    );

    expect(url).toBeUndefined();
  });
});

describe('buildLogoUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should build logo URL from profile logoId', async () => {
    const url = await buildLogoUrl(mockProfile, null);
    expect(url).toBe(
      'https://res.cloudinary.com/azzapp-dev/image/upload/c_fill,w_720/v1/logo-image-id.jpg',
    );
  });

  test('should build logo URL from webcard logoId if webcard is multiuser', async () => {
    const url = await buildLogoUrl(
      { ...mockProfile, logoId: null },
      {
        ...mockWebCard,
        isMultiUser: true,
        logoId: 'webcard-logo-image-id',
      },
    );
    expect(url).toBe(
      'https://res.cloudinary.com/azzapp-dev/image/upload/c_fill,w_720/v1/webcard-logo-image-id.jpg',
    );
  });

  test('should return logo null', async () => {
    const url = await buildLogoUrl(
      { ...mockProfile, logoId: null },
      mockWebCard,
    );
    expect(url).toBeNull();
  });
});

describe('buildBannerUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should build banner URL from profile bannerId', async () => {
    const url = await buildBannerUrl(mockProfile, null);
    expect(url).toBe(
      'https://res.cloudinary.com/azzapp-dev/image/upload/c_fill,w_1200/v1/banner-image-id.jpg',
    );
  });

  test('should build banner URL from webcard bannerId if webcard is multiuser', async () => {
    const url = await buildBannerUrl(
      { ...mockProfile, bannerId: null },
      {
        ...mockWebCard,
        isMultiUser: true,
        bannerId: 'webcard-banner-image-id',
      },
    );
    expect(url).toBe(
      'https://res.cloudinary.com/azzapp-dev/image/upload/c_fill,w_1200/v1/webcard-banner-image-id.jpg',
    );
  });

  test('should return banner null', async () => {
    const url = await buildBannerUrl(
      { ...mockProfile, bannerId: null },
      mockWebCard,
    );
    expect(url).toBeNull();
  });
});
