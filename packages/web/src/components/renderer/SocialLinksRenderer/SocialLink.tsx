import { LINKS_ELEMENT_WRAPPER_MULTIPLER } from '@azzapp/shared/coverHelpers';
import { generateSocialLink } from '@azzapp/shared/socialLinkHelpers';
import SocialIcon from '#ui/SocialIcons/SocialIcon';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';

type SocialLinkProps = {
  link: SocialLinkType;
  iconSize: number;
  borderWidth: number;
  iconColor: string;
  className?: string;
};

const SocialLink = (props: SocialLinkProps) => {
  const { link, iconSize, borderWidth, iconColor, className } = props;

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
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        <SocialIcon
          icon={id}
          width={iconSize / LINKS_ELEMENT_WRAPPER_MULTIPLER}
          height={iconSize / LINKS_ELEMENT_WRAPPER_MULTIPLER}
          color={iconColor}
          fill={iconColor}
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
