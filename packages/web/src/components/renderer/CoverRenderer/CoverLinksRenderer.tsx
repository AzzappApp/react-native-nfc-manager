import cn from 'classnames';
import { useMemo } from 'react';
import { DEFAULT_COLOR_PALETTE, swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_LINK_SIZE_TO_BORDER_RATIO,
  LINKS_ELEMENT_WRAPPER_MULTIPLER,
  LINKS_GAP,
  calculateLinksSize,
  convertToBaseCanvasRatio,
} from '@azzapp/shared/coverHelpers';
import SocialLink from '../SocialLinksRenderer/SocialLink';
import styles from './CoverRenderer.css';
import type { CoverDynamicLinks, WebCard } from '@azzapp/data';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';

type Props = {
  coverSize: { width: number; height: number };
  links: CoverDynamicLinks;
  cardColors?: WebCard['cardColors'];
};

const CoverLinksRenderer = ({ coverSize, links, cardColors }: Props) => {
  const linksSize = useMemo(() => {
    if (!coverSize || !links)
      return {
        width: 0,
        height: 0,
      };

    const linksSizePercent = calculateLinksSize(
      links.links.length,
      links.size,
      {
        viewHeight: coverSize.height,
        viewWidth: coverSize.width,
      },
    );

    return {
      width: (linksSizePercent.width * coverSize.width) / 100,
      height: (linksSizePercent.height * coverSize.height) / 100,
    };
  }, [links, coverSize]);

  const socialIconSize = coverSize
    ? convertToBaseCanvasRatio(links.size, coverSize?.width) *
      LINKS_ELEMENT_WRAPPER_MULTIPLER
    : 0;

  const borderWidth = coverSize
    ? convertToBaseCanvasRatio(
        links.size / COVER_LINK_SIZE_TO_BORDER_RATIO,
        coverSize?.width,
      )
    : 0;

  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        top: `calc(${links.position.y}% - ${linksSize.height / 2}px)`,
        left: `calc(${links.position.x}% - ${linksSize.width / 2}px)`,
        gap: convertToBaseCanvasRatio(LINKS_GAP, coverSize.width),
      }}
    >
      {links.links.map((link, i) => (
        <SocialLink
          key={link.socialId}
          link={{
            link: link.link,
            position: i,
            socialId: link.socialId as SocialLinkId,
          }}
          iconColor={swapColor(
            links.color,
            cardColors ?? DEFAULT_COLOR_PALETTE,
          )}
          borderWidth={borderWidth}
          iconSize={socialIconSize}
          className={cn({ [styles.linkShadow]: links.shadow })}
        />
      ))}
    </div>
  );
};

export default CoverLinksRenderer;
