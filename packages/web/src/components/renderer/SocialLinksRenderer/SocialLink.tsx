import { SOCIAL_LINKS } from '@azzapp/shared/socialLinkHelpers';
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

const SOCIAL_LINKS_URL_MAP = new Map(
  SOCIAL_LINKS.map(({ id, mask }) => [id, mask]),
);

export default SocialLink;
