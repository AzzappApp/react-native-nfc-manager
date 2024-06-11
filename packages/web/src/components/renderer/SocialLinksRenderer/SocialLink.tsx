import { generateSocialLink } from '@azzapp/shared/socialLinkHelpers';
import SocialIcon from '#ui/SocialIcons/SocialIcon';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';

type SocialLinkProps = {
  link: SocialLinkType;
  iconSize: number;
  borderWidth: number;
  iconColor: string;
};

const SocialLink = (props: SocialLinkProps) => {
  const { link, iconSize, borderWidth, iconColor } = props;

  const id = link.socialId;

  return (
    <div
      style={{
        display: 'inline-flex',
      }}
    >
      <a
        href={generateSocialLink(id, link.link)}
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
        aria-label={link.socialId}
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
  socialId: SocialLinkId;
  link: string;
  position: number;
};

export default SocialLink;
