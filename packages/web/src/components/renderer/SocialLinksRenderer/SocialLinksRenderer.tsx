'use client';
import cn from 'classnames';
import { SOCIAL_LINKS_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from '../../CardModuleBackground';
import SocialLink from './SocialLink';
import styles from './SocialLinksRenderer.css';
import type { SocialLinkType } from './SocialLink';
import type { ModuleRendererProps } from '../ModuleRenderer';

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
    marginHorizontal,
  } = Object.assign({}, SOCIAL_LINKS_DEFAULT_VALUES, module.data);

  const linksOrdered =
    (links as SocialLinkType[])
      ?.slice()
      .sort((a, b) => a.position - b.position) ?? [];

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
    >
      {arrangement === 'inline' ? (
        <div
          style={{
            paddingLeft: marginHorizontal,
            paddingRight: marginHorizontal,
          }}
          className={styles.linksInlineWrapper}
        >
          <div
            className={cn(styles.links, styles.linksInline)}
            style={{
              marginTop,
              marginBottom,
              columnGap,
            }}
          >
            {linksOrdered.map(link => (
              <SocialLink
                key={link.socialId}
                link={link}
                borderWidth={borderWidth}
                iconColor={iconColor}
                iconSize={iconSize}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          className={cn(styles.links, styles.linksBlock)}
          style={{
            marginTop,
            marginBottom,
            columnGap,
            rowGap: columnGap,
            maxWidth: 800,
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: marginHorizontal,
            paddingRight: marginHorizontal,
          }}
        >
          {linksOrdered.map(link => (
            <SocialLink
              key={link.socialId}
              link={link}
              borderWidth={borderWidth}
              iconColor={iconColor}
              iconSize={iconSize}
            />
          ))}
        </div>
      )}
    </CardModuleBackground>
  );
};

export default SocialLinksRenderer;
