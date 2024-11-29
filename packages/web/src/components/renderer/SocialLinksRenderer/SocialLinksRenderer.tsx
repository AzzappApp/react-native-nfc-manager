'use client';
import cn from 'classnames';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getModuleDataValues,
  SOCIAL_LINKS_DEFAULT_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from '../../CardModuleBackground';
import SocialLink from './SocialLink';
import styles from './SocialLinksRenderer.css';
import type { SocialLinkType } from './SocialLink';
import type { ModuleRendererProps } from '../ModuleRenderer';
import type { CardModuleSocialLinks } from '@azzapp/data';

export type SocialLinksRendererProps =
  ModuleRendererProps<CardModuleSocialLinks> &
    Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

/**
 * Render a SocialLinks module
 */
const SocialLinksRenderer = ({
  module,
  colorPalette,
  cardStyle,
  coverBackgroundColor,
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
  } = getModuleDataValues({
    data: module.data,
    cardStyle,
    styleValuesMap: {},
    defaultValues: SOCIAL_LINKS_DEFAULT_VALUES,
  });

  const linksOrdered =
    (links as SocialLinkType[])
      ?.slice()
      .sort((a, b) => a.position - b.position) ?? [];

  return (
    <CardModuleBackground
      {...props}
      colorPalette={colorPalette}
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
                iconColor={swapColor(iconColor, colorPalette)}
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
              iconColor={swapColor(iconColor, colorPalette)}
              iconSize={iconSize}
            />
          ))}
        </div>
      )}
    </CardModuleBackground>
  );
};

export default SocialLinksRenderer;
