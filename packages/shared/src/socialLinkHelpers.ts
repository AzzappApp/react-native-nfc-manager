export const SOCIAL_NETWORK_LINKS = [
  { id: 'facebook', mask: 'facebook.com/' },
  { id: 'instagram', mask: 'instagram.com/' },
  { id: 'youtube', mask: 'youtube.com/' },
  { id: 'messenger', mask: 'm.me/' },
  { id: 'twitter', mask: 'twitter.com/', label: 'X' },
  { id: 'linkedin', mask: 'linkedin.com/' },
  { id: 'tiktok', mask: 'tiktok.com/@', label: 'TikTok' },
  { id: 'snapchat', mask: 'snapchat.com/add/' },
  { id: 'whatsapp', mask: 'wa.me/', label: 'WhatsApp' },
  { id: 'pinterest', mask: 'pinterest.com/' },
  { id: 'reddit', mask: 'reddit.com/r/' },
  { id: 'twitch', mask: 'twitch.tv/' },
  { id: 'discord', mask: 'discord.gg/' },
  { id: 'medium', mask: 'medium.com/@' },
  { id: 'tumblr', mask: 'tumblr.com/' },
  { id: 'github', mask: 'github.com/', label: 'GitHub' },
  { id: 'behance', mask: 'behance.net/' },
  { id: 'dribbble', mask: 'dribbble.com/' },
  { id: 'vimeo', mask: 'vimeo.com/' },
  { id: 'flickr', mask: 'flickr.com/' },
  { id: 'soundcloud', mask: 'soundcloud.com/', label: 'SoundCLoud' },
  { id: 'spotify', mask: 'open.spotify.com/artist/' },
  { id: 'wechat', mask: 'wechat.com/', label: 'We Chat' },
  { id: 'telegram', mask: 't.me/' },
  { id: 'patreon', mask: 'patreon.com/' },
  { id: 'producthunt', mask: 'producthunt.com/', label: 'Product Hunt' },
  { id: 'dev', mask: 'dev.to/' },
  { id: 'figma', mask: 'figma.com/' },
  { id: 'gitlab', mask: 'gitlab.com/' },
  { id: 'glassdoor', mask: 'glassdoor.com/' },
  { id: 'hashnode', mask: 'hashnode.com/@' },
  { id: 'letterboxd', mask: 'letterboxd.com/' },
  { id: 'mastodon', mask: 'mastodon.social/@' },
  { id: 'npm', mask: 'npmjs.com/~' },
  { id: 'tripadvisor', mask: 'tripadvisor.com/' },
  { id: 'typefully', mask: 'typefully.app/' },
  { id: 'yelp', mask: 'yelp.com/@' },
] as const;

export const SOCIAL_LINKS = [
  {
    id: 'website',
    mask: '',
  },
  { id: 'mail', mask: '' },
  { id: 'phone', mask: '' },
  { id: 'sms', mask: '' },
  ...SOCIAL_NETWORK_LINKS,
] as const;

export type SocialLinkId = (typeof SOCIAL_LINKS)[number]['id'];

export const generateSocialLink = (id: SocialLinkId, content: string) => {
  let link = 'https://';

  const mask = SOCIAL_LINKS_URL_MAP.get(id)!;

  if (id === 'phone') link = `tel:`;
  if (id === 'sms') link = 'sms:';
  if (id === 'mail') link = 'mailto:';
  if (id === 'website') return content;

  return `${link}${mask}${content}`;
};

const SOCIAL_LINKS_URL_MAP = new Map(
  SOCIAL_LINKS.map(({ id, mask }) => [id, mask]),
);
