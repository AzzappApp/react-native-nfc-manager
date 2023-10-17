import SocialIcon from '#ui/SocialIcons/SocialIcon';
import type { SocialIcons } from '#ui/SocialIcons/SocialIcon';

type SocialLinkProps = {
  link: SocialLinkType;
  iconSize: number;
  borderWidth: number;
  iconColor: string;
};

const SocialLink = (props: SocialLinkProps) => {
  const { link, iconSize, borderWidth, iconColor } = props;

  const id = link.socialId;
  const mask = SOCIAL_LINKS_URL_MAP.get(id)!;

  return (
    <div
      style={{
        display: 'inline-flex',
      }}
    >
      <a
        href={generateLink(mask, link.link, id)}
        style={{
          display: 'flex',
          width: iconSize,
          height: iconSize,
          borderStyle: 'solid',
          borderWidth,
          borderRadius: iconSize / 2,
          borderColor: iconColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SocialIcon
          icon={id}
          width={iconSize - 22}
          height={iconSize - 22}
          color={iconColor}
        />
      </a>
    </div>
  );
};

export type SocialLinkType = {
  socialId: SocialIcons;
  link: string;
  position: number;
};

const generateLink = (mask: string, content: string, type: string) => {
  let link = 'https://';

  if (type === 'phone') link = `tel:`;
  if (type === 'sms') link = 'sms:';
  if (type === 'mail') link = 'mailto:';

  return `${link}${mask}${content}`;
};

export const SOCIAL_LINKS: Array<{ id: SocialIcons; mask: string }> = [
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
  { id: 'website', mask: '' },
  { id: 'sms', mask: '' },
  { id: 'phone', mask: '' },
  { id: 'mail', mask: '' },
];

const SOCIAL_LINKS_URL_MAP = new Map(
  SOCIAL_LINKS.map(({ id, mask }) => [id, mask]),
);

export default SocialLink;
