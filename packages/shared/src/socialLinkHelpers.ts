import { isValidUrl } from './stringHelpers';

// generic item from configuration list

const socialLinkFacebook = {
  id: 'facebook',
  mask: 'facebook.com/',
  label: 'Facebook',
} as const;
const socialLinkInstagram = {
  id: 'instagram',
  mask: 'instagram.com/',
  label: 'Instagram',
} as const;
const socialLinkYoutube = {
  id: 'youtube',
  mask: 'youtube.com/',
  label: 'Youtube',
} as const;
const socialLinkMessenger = {
  id: 'messenger',
  mask: 'm.me/',
  label: 'Messenger',
} as const;
const socialLinkTwitter = {
  id: 'twitter',
  mask: 'twitter.com/',
  label: 'X',
} as const;
const socialLinkLinkedin = {
  id: 'linkedin',
  mask: 'linkedin.com/in/',
  label: 'LinkedIn',
} as const;
const socialLinkTiktok = {
  id: 'tiktok',
  mask: 'tiktok.com/@',
  label: 'TikTok',
} as const;
const socialLinkSnapchat = {
  id: 'snapchat',
  mask: 'snapchat.com/add/',
  label: 'Snapchat',
} as const;
const socialLinkWhatsapp = {
  id: 'whatsapp',
  mask: 'wa.me/',
  label: 'WhatsApp',
} as const;
const socialLinkPinterest = {
  id: 'pinterest',
  mask: 'pinterest.com/',
  label: 'Pinterest',
} as const;
const socialLinkReddit = {
  id: 'reddit',
  mask: 'reddit.com/r/',
  label: 'Reddit',
} as const;
const socialLinkTwitch = {
  id: 'twitch',
  mask: 'twitch.tv/',
  label: 'Twitch',
} as const;
const socialLinkDiscord = {
  id: 'discord',
  mask: 'discord.gg/',
  label: 'Discord',
} as const;
const socialLinkMedium = {
  id: 'medium',
  mask: 'medium.com/@',
  label: 'Medium',
} as const;
const socialLinkTumblr = {
  id: 'tumblr',
  mask: 'tumblr.com/',
  label: 'Tumblr',
} as const;
const socialLinkGithub = {
  id: 'github',
  mask: 'github.com/',
  label: 'GitHub',
} as const;
const socialLinkBehance = {
  id: 'behance',
  mask: 'behance.net/',
  label: 'Behance',
} as const;
const socialLinkDribbble = {
  id: 'dribbble',
  mask: 'dribbble.com/',
  label: 'Dribbble',
} as const;
const socialLinkVimeo = {
  id: 'vimeo',
  mask: 'vimeo.com/',
  label: 'Vimeo',
} as const;
const socialLinkFlickr = {
  id: 'flickr',
  mask: 'flickr.com/',
  label: 'Flickr',
} as const;
const socialLinkSoundcloud = {
  id: 'soundcloud',
  mask: 'soundcloud.com/',
  label: 'SoundCloud',
} as const;
const socialLinkSpotify = {
  id: 'spotify',
  mask: 'open.spotify.com/artist/',
  label: 'Spotify',
} as const;
const socialLinkWechat = {
  id: 'wechat',
  mask: 'wechat.com/',
  label: 'We Chat',
} as const;
const socialLinkTelegram = {
  id: 'telegram',
  mask: 't.me/',
  label: 'Telegram',
} as const;
const socialLinkPatreon = {
  id: 'patreon',
  mask: 'patreon.com/',
  label: 'Patreon',
} as const;
const socialLinkProducthunt = {
  id: 'producthunt',
  mask: 'producthunt.com/',
  label: 'Product Hunt',
} as const;
const socialLinkDev = { id: 'dev', mask: 'dev.to/', label: 'Dev' } as const;
const socialLinkFigma = {
  id: 'figma',
  mask: 'figma.com/',
  label: 'Figma',
} as const;
const socialLinkGitlab = {
  id: 'gitlab',
  mask: 'gitlab.com/',
  label: 'GitLab',
} as const;
const socialLinkGlassdoor = {
  id: 'glassdoor',
  mask: 'glassdoor.com/',
  label: 'Glassdoor',
} as const;
const socialLinkHashnode = {
  id: 'hashnode',
  mask: 'hashnode.com/@',
  label: 'Hashnode',
} as const;
const socialLinkLetterboxd = {
  id: 'letterboxd',
  mask: 'letterboxd.com/',
  label: 'Letterboxd',
} as const;
const socialLinkMastodon = {
  id: 'mastodon',
  mask: '', // no mask needed for mastodon as very boddy can make his own instance
  label: 'Mastodon',
} as const;
const socialLinkNpm = { id: 'npm', mask: 'npmjs.com/~', label: 'npm' } as const;
const socialLinkTripadvisor = {
  id: 'tripadvisor',
  mask: 'tripadvisor.com/',
  label: 'Tripadvisor',
} as const;
const socialLinkTypefully = {
  id: 'typefully',
  mask: 'typefully.app/',
  label: 'Typefully',
} as const;
const socialLinkYelp = {
  id: 'yelp',
  mask: 'yelp.com/@',
  label: 'Yelp',
} as const;

export const SOCIAL_NETWORK_LINKS = [
  socialLinkFacebook,
  socialLinkInstagram,
  socialLinkYoutube,
  socialLinkMessenger,
  socialLinkTwitter,
  socialLinkLinkedin,
  socialLinkTiktok,
  socialLinkSnapchat,
  socialLinkWhatsapp,
  socialLinkPinterest,
  socialLinkReddit,
  socialLinkTwitch,
  socialLinkDiscord,
  socialLinkMedium,
  socialLinkTumblr,
  socialLinkGithub,
  socialLinkBehance,
  socialLinkDribbble,
  socialLinkVimeo,
  socialLinkFlickr,
  socialLinkSoundcloud,
  socialLinkSpotify,
  socialLinkWechat,
  socialLinkTelegram,
  socialLinkPatreon,
  socialLinkProducthunt,
  socialLinkDev,
  socialLinkFigma,
  socialLinkGitlab,
  socialLinkGlassdoor,
  socialLinkHashnode,
  socialLinkLetterboxd,
  socialLinkMastodon,
  socialLinkNpm,
  socialLinkTripadvisor,
  socialLinkTypefully,
  socialLinkYelp,
] as const;

/* these labels shall be translated */
export const socialLinkWebsite = {
  id: 'website',
  mask: '',
  label: 'Website',
} as const;

const socialLinkLink = {
  id: 'link',
  mask: '',
  label: 'Link',
} as const;

const socialLinkMail = {
  id: 'mail',
  mask: '',
  label: 'Mail',
} as const;

const socialLinkPhone = {
  id: 'phone',
  mask: '',
  label: 'Phone',
} as const;
const socialLinkSms = {
  id: 'sms',
  mask: '',
  label: 'SMS',
} as const;

export const SOCIAL_LINKS = [
  socialLinkWebsite,
  socialLinkLink,
  socialLinkMail,
  socialLinkPhone,
  socialLinkSms,
  ...SOCIAL_NETWORK_LINKS,
] as const;

export type SocialLinkItemType = (typeof SOCIAL_LINKS)[number];

export type SocialLinkId = (typeof SOCIAL_LINKS)[number]['id'];

export const isSocialLinkId = (id: string): id is SocialLinkId => {
  return SOCIAL_LINKS.some(item => item.id === id);
};

export const filterSocialLink = (
  socialLinks?: Array<{ label: string; url: string }> | null,
) => {
  return socialLinks
    ?.map(({ label, url }) =>
      isSocialLinkId(label)
        ? {
            label,
            url,
          }
        : null,
    )
    .filter(l => l !== null);
};

// a configured item link
export type SocialLinkItem = {
  socialId: SocialLinkId;
  link: string;
  position: number;
};

export const SOCIAL_NETWORK_LINKS_LABELS = SOCIAL_NETWORK_LINKS.map(
  socialLink => ({
    key: socialLink.id as string,
    value: socialLink.label,
  }),
);

// bluesky & parler & Weibo can also be added
export type SocialLinkCategory = {
  id: string;
  item: SocialLinkItemType[];
};
export const SocialLinksByCategory: SocialLinkCategory[] = [
  {
    id: 'URL',
    item: [socialLinkWebsite, socialLinkLink],
  },
  {
    id: 'Contact',
    item: [
      socialLinkPhone,
      socialLinkSms,
      socialLinkMessenger,
      socialLinkWhatsapp,
      socialLinkMail,
      socialLinkTelegram,
      socialLinkSnapchat,
      socialLinkDiscord,
      socialLinkWechat,
    ],
  },
  {
    id: 'Social',
    item: [
      socialLinkFacebook,
      socialLinkInstagram,
      socialLinkLinkedin,
      socialLinkTwitter,
      socialLinkMastodon,
      socialLinkTiktok,
      socialLinkReddit,
      socialLinkTumblr,
      socialLinkPinterest,
    ],
  },
  {
    id: 'Creative Platforms',
    item: [
      socialLinkBehance,
      socialLinkDribbble,
      socialLinkFigma,
      socialLinkDev,
      socialLinkMedium,
      socialLinkHashnode,
      socialLinkProducthunt,
    ],
  },
  {
    id: 'Entertainment',
    item: [
      socialLinkYoutube,
      socialLinkSpotify,
      socialLinkSoundcloud,
      socialLinkVimeo,
      socialLinkFlickr,
      socialLinkLetterboxd,
    ],
  },
  {
    id: 'Professional/Business',
    item: [
      socialLinkGithub,
      socialLinkGitlab,
      socialLinkGlassdoor,
      socialLinkNpm,
      socialLinkTripadvisor,
      socialLinkYelp,
    ],
  },
];
export type SocialLinkCategoryId = (typeof SocialLinksByCategory)[number]['id'];

export const generateSocialLink = (id: SocialLinkId, content: string) => {
  if (id === 'phone') return `tel:${content}`;
  if (id === 'sms') return `sms:${content}`;
  if (id === 'mail') return `mailto:${content}`;

  let result = content;

  // only username were stored before, so for backward compatibility we have to build the url as done before
  if (!isValidUrl(result)) {
    const socialLink = SOCIAL_NETWORK_LINKS.find(item => id === item.id);
    if (socialLink) {
      const mask = socialLink.mask;
      if (mask) {
        result = `https://${mask}${content}`;
      }
    }
  }

  return result;
};

export const getUserNameFromUrl = (url: string) => {
  const socialLink = SOCIAL_NETWORK_LINKS.find(item => url.includes(item.mask));
  if (url.startsWith('https://') || url.startsWith('http://')) {
    url = url.replace('https://', '').replace('http://', '');
  }
  if (socialLink) {
    const mask = socialLink.mask;
    if (mask) {
      const index = url.indexOf(mask);
      if (index !== -1) {
        return url.substring(index + mask.length);
      }
    }
  }

  return null;
};
