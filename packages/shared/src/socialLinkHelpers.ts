export const SOCIAL_NETWORK_LINKS = [
  { id: 'behance', mask: 'behance.net/' },
  { id: 'dev', mask: 'dev.to/' },
  { id: 'discord', mask: 'discord.gg/' },
  { id: 'dribbble', mask: 'dribbble.com/' },
  { id: 'facebook', mask: 'facebook.com/' },
  { id: 'figma', mask: 'figma.com/' },
  { id: 'github', mask: 'github.com/' },
  { id: 'gitlab', mask: 'gitlab.com/' },
  { id: 'glassdoor', mask: 'glassdoor.com/' },
  { id: 'hashnode', mask: 'hashnode.com/@' },
  { id: 'instagram', mask: 'instagram.com/' },
  { id: 'letterboxd', mask: 'letterboxd.com/' },
  { id: 'linkedin', mask: 'linkedin.com/' },
  { id: 'mastodon', mask: 'mastodon.social/@' },
  { id: 'messenger', mask: 'm.me/' },
  { id: 'npm', mask: 'npmjs.com/' },
  { id: 'patreon', mask: 'patreon.com/' },
  { id: 'pinterest', mask: 'pinterest.com/' },
  { id: 'snapchat', mask: 'snapchat.com/add/' },
  { id: 'telegram', mask: 't.me/' },
  { id: 'tiktok', mask: 'tiktok.com/@' },
  { id: 'tripadvisor', mask: 'tripadvisor.com/' },
  { id: 'twitch', mask: 'twitch.tv/' },
  { id: 'twitter', mask: 'twitter.com/', label: 'X' },
  { id: 'typefully', mask: 'typefully.app/' },
  { id: 'whatsapp', mask: 'wa.me/' },
  { id: 'yelp', mask: 'yelp.com/@' },
  { id: 'youtube', mask: 'youtube.com/' },
] as const;

export const SOCIAL_LINKS = [
  ...SOCIAL_NETWORK_LINKS,
  {
    id: 'website',
    mask: '',
  },
  { id: 'phone', mask: '' },
  { id: 'mail', mask: '' },
  { id: 'sms', mask: '' },
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
