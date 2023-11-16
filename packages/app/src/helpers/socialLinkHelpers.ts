import type { SocialIcons } from '#ui/Icon';

export const SOCIAL_NETWORK_LINKS: Array<{ id: SocialIcons; mask: string }> = [
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
  { id: 'linkedin', mask: 'linkedin.com/in/' },
  { id: 'mastodon', mask: 'mastodon.social/' },
  { id: 'messenger', mask: 'm.me/' },
  { id: 'npm', mask: 'npmjs.com/' },
  { id: 'patreon', mask: 'patreon.com/' },
  { id: 'pinterest', mask: 'pinterest.com/' },
  { id: 'snapchat', mask: 'snapchat.com/add/' },
  { id: 'telegram', mask: 't.me/' },
  { id: 'tiktok', mask: 'tiktok.com/@' },
  { id: 'tripadvisor', mask: 'tripadvisor.com/' },
  { id: 'twitch', mask: 'twitch.tv/' },
  { id: 'twitter', mask: 'twitter.com/' },
  { id: 'typefully', mask: 'typefully.app/' },
  { id: 'whatsapp', mask: 'wa.me/' },
  { id: 'yelp', mask: 'yelp.com/' },
  { id: 'youtube', mask: 'youtube.com/' },
];

export const SOCIAL_LINKS = SOCIAL_NETWORK_LINKS.concat([
  { id: 'website', mask: '' },
  { id: 'phone', mask: '' },
  { id: 'mail', mask: '' },
  { id: 'sms', mask: '' },
]);
