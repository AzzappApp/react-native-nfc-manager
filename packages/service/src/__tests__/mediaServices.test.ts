import { getMediasByIds } from '@azzapp/data';
import { buildAvatarUrl, buildCoverImageUrl } from '../mediaServices';
import type { Profile, WebCard } from '@azzapp/data';

// Mock dependencies
jest.mock('@azzapp/data', () => ({
  getMediasByIds: jest.fn(),
}));

jest.mock('@azzapp/shared/imagesHelpers', () => ({
  CLOUDINARY_BASE_URL: 'https://res.cloudinary.com/demo',
  DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL: 10,
}));

const mockProfile: Profile = {
  id: 'profile-123',
  userId: 'user-456',
  webCardId: 'webcard-789',
  avatarId: 'avatar-image-id',
  logoId: 'logo-image-id',
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
  createdAt: new Date(),
  deleted: false,
  deletedAt: null,
  deletedBy: null,
  lastUserNameUpdate: new Date(),
  webCardKind: 'personal',
  webCardCategoryId: null,
  firstName: null,
  lastName: null,
  companyName: null,
  companyActivityId: null,
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
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_720/v1/avatar-image-id.jpg',
    );
  });

  test('should fallback to logoId if avatarId is missing', async () => {
    const url = await buildAvatarUrl({ ...mockProfile, avatarId: null }, null);
    expect(url).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_720/v1/logo-image-id.jpg',
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
      'https://res.cloudinary.com/demo/image/upload/c_fill,g_east,w_720,h_720,ar_1:1/cover-image-id.png',
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
      'https://res.cloudinary.com/demo/video/upload/so_20p/c_fill,g_east,w_720,h_720,ar_1:1/cover-image-id.png',
    );
  });

  test('should return default preview position for video if none is provided', async () => {
    (getMediasByIds as jest.Mock).mockResolvedValue([{ kind: 'video' }]);

    const url = await buildCoverImageUrl(
      { ...mockWebCard, coverPreviewPositionPercentage: null },
      { width: 720, height: 720, crop: 'fill' },
    );

    expect(url).toBe(
      'https://res.cloudinary.com/demo/video/upload/so_10p/c_fill,g_east,w_720,h_720,ar_1:1/cover-image-id.png',
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
