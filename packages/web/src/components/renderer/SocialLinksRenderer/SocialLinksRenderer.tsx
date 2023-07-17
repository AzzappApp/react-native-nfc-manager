import cn from 'classnames';
import { SOCIAL_LINKS_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import SocialIcon from '#ui/SocialIcons/SocialIcon';
import CardModuleBackground from '../../CardModuleBackground';
import styles from './SocialLinksRenderer.css';
import type { SocialIcons } from '#ui/SocialIcons/SocialIcon';
import type { ModuleRendererProps } from '../ModuleRenderer';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';

export type SocialLinksRendererProps = ModuleRendererProps &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

/**
 * Render a SocialLinks module
 */
const SocialLinksRenderer = ({
  module,
  ...props
}: SocialLinksRendererProps) => {
  const {
    links,
    iconSize,
    iconColor,
    arrangement,
    borderWidth,
    columnGap,
    marginTop,
    marginBottom,
    backgroundId,
    backgroundStyle,
  } = Object.assign({}, SOCIAL_LINKS_DEFAULT_VALUES, module.data);

  const linksOrdered =
    (
      links as Array<{
        socialId: SocialIcons;
        link: string;
        position: number;
      }>
    )
      ?.slice()
      .sort((a, b) => a.position - b.position) ?? [];

  const renderLink = (
    link: ArrayItemType<typeof linksOrdered>,
    index: number,
  ) => {
    const id = link.socialId;
    const mask = SOCIAL_LINKS_URL_MAP.get(id)!;
    return (
      <a
        key={index}
        href={`https://${mask}${link.link}`}
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
    );
  };

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
    >
      {arrangement === 'inline' ? (
        <div
          className={cn(styles.links, styles.linksInline)}
          style={{
            marginTop,
            marginBottom,
            columnGap,
          }}
        >
          {linksOrdered.map(renderLink)}
        </div>
      ) : (
        <div
          className={cn(styles.links, styles.linksBlock)}
          style={{
            marginTop,
            marginBottom,
            columnGap,
            rowGap: columnGap,
          }}
        >
          {linksOrdered.map(renderLink)}
        </div>
      )}
    </CardModuleBackground>
  );
};

export default SocialLinksRenderer;

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
  { id: 'google', mask: 'google.com/' },
  { id: 'hashnode', mask: 'hashnode.com/' },
  { id: 'instagram', mask: 'instagram.com/' },
  { id: 'kult', mask: 'kult.cc/' },
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
  { id: 'youtube', mask: 'youtube.com/channel/' },
];

const SOCIAL_LINKS_URL_MAP = new Map(
  SOCIAL_LINKS.map(({ id, mask }) => [id, mask]),
);
