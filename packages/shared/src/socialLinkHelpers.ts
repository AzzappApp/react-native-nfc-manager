import { isValidUrl } from './stringHelpers';

// generic item from configuration list
export type SocialLinkItemType = {
  id: string;
  mask: string;
  label: string;
};

const socialLinkFacebook = {
  id: 'facebook',
  mask: 'facebook.com/',
  label: 'Facebook',
};
const socialLinkInstagram = {
  id: 'instagram',
  mask: 'instagram.com/',
  label: 'Instagram',
};
const socialLinkYoutube = {
  id: 'youtube',
  mask: 'youtube.com/',
  label: 'Youtube',
};
const socialLinkMessenger = {
  id: 'messenger',
  mask: 'm.me/',
  label: 'Messenger',
};
const socialLinkTwitter = { id: 'twitter', mask: 'twitter.com/', label: 'X' };
const socialLinkLinkedin = {
  id: 'linkedin',
  mask: 'linkedin.com/',
  label: 'LinkedIn',
};
const socialLinkTiktok = {
  id: 'tiktok',
  mask: 'tiktok.com/@',
  label: 'TikTok',
};
const socialLinkSnapchat = {
  id: 'snapchat',
  mask: 'snapchat.com/add/',
  label: 'Snapchat',
};
const socialLinkWhatsapp = {
  id: 'whatsapp',
  mask: 'wa.me/',
  label: 'WhatsApp',
};
const socialLinkPinterest = {
  id: 'pinterest',
  mask: 'pinterest.com/',
  label: 'Pinterest',
};
const socialLinkReddit = {
  id: 'reddit',
  mask: 'reddit.com/r/',
  label: 'Reddit',
};
const socialLinkTwitch = { id: 'twitch', mask: 'twitch.tv/', label: 'Twitch' };
const socialLinkDiscord = {
  id: 'discord',
  mask: 'discord.gg/',
  label: 'Discord',
};
const socialLinkMedium = {
  id: 'medium',
  mask: 'medium.com/@',
  label: 'Medium',
};
const socialLinkTumblr = { id: 'tumblr', mask: 'tumblr.com/', label: 'Tumblr' };
const socialLinkGithub = { id: 'github', mask: 'github.com/', label: 'GitHub' };
const socialLinkBehance = {
  id: 'behance',
  mask: 'behance.net/',
  label: 'Behance',
};
const socialLinkDribbble = {
  id: 'dribbble',
  mask: 'dribbble.com/',
  label: 'Dribbble',
};
const socialLinkVimeo = { id: 'vimeo', mask: 'vimeo.com/', label: 'Vimeo' };
const socialLinkFlickr = { id: 'flickr', mask: 'flickr.com/', label: 'Flickr' };

const socialLinkSoundcloud = {
  id: 'soundcloud',
  mask: 'soundcloud.com/',
  label: 'SoundCloud',
};
const socialLinkSpotify = {
  id: 'spotify',
  mask: 'open.spotify.com/artist/',
  label: 'Spotify',
};
const socialLinkWechat = {
  id: 'wechat',
  mask: 'wechat.com/',
  label: 'We Chat',
};
const socialLinkTelegram = { id: 'telegram', mask: 't.me/', label: 'Telegram' };
const socialLinkPatreon = {
  id: 'patreon',
  mask: 'patreon.com/',
  label: 'Patreon',
};
const socialLinkProducthunt = {
  id: 'producthunt',
  mask: 'producthunt.com/',
  label: 'Product Hunt',
};
const socialLinkDev = { id: 'dev', mask: 'dev.to/', label: 'Dev' };
const socialLinkFigma = { id: 'figma', mask: 'figma.com/', label: 'Figma' };
const socialLinkGitlab = { id: 'gitlab', mask: 'gitlab.com/', label: 'GitLab' };
const socialLinkGlassdoor = {
  id: 'glassdoor',
  mask: 'glassdoor.com/',
  label: 'Glassdoor',
};
const socialLinkHashnode = {
  id: 'hashnode',
  mask: 'hashnode.com/@',
  label: 'Hashnode',
};
const socialLinkLetterboxd = {
  id: 'letterboxd',
  mask: 'letterboxd.com/',
  label: 'Letterboxd',
};
const socialLinkMastodon = {
  id: 'mastodon',
  mask: '', // no mask needed for mastodon as very boddy can make his own instance
  label: 'Mastodon',
};
const socialLinkNpm = { id: 'npm', mask: 'npmjs.com/~', label: 'npm' };
const socialLinkTripadvisor = {
  id: 'tripadvisor',
  mask: 'tripadvisor.com/',
  label: 'Tripadvisor',
};
const socialLinkTypefully = {
  id: 'typefully',
  mask: 'typefully.app/',
  label: 'Typefully',
};
const socialLinkYelp = { id: 'yelp', mask: 'yelp.com/@', label: 'Yelp' };

export const SOCIAL_NETWORK_LINKS: SocialLinkItemType[] = [
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
};

const socialLinkLink = {
  id: 'link',
  mask: '',
  label: 'Link',
};

const socialLinkMail = {
  id: 'mail',
  mask: '',
  label: 'Mail',
};
const socialLinkPhone = {
  id: 'phone',
  mask: '',
  label: 'Phone',
};
const socialLinkSms = {
  id: 'sms',
  mask: '',
  label: 'SMS',
};

export const SOCIAL_LINKS: SocialLinkItemType[] = [
  socialLinkWebsite,
  socialLinkLink,
  socialLinkMail,
  socialLinkPhone,
  socialLinkSms,
  ...SOCIAL_NETWORK_LINKS,
] as const;

export type SocialLinkId = (typeof SOCIAL_LINKS)[number]['id'];

// a configured item link
export type SocialLinkItem = {
  socialId: string;
  link: string;
  position: number;
};

// bluesky & parler & Weibo can also be added
export type SocialLinkCategory = { id: string; item: SocialLinkItemType[] };
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
