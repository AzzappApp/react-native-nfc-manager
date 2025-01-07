'use client';

import cn from 'classnames';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { colors } from '@azzapp/shared/colorsHelpers';
import arrows from '@azzapp/web/public/arrows@3x.png';
import { FlipIcon } from '#assets';
import { ButtonIcon } from '#ui';
import ContactSteps from '#components/ContactSteps';
import CoverRenderer from '#components/renderer/CoverRenderer';
import { MAX_COVER_WIDTH } from '#components/renderer/CoverRenderer/CoverRenderer.css';
import CoverRendererBackground from '#components/renderer/CoverRenderer/CoverRendererBackground';
import { DeviceType, getDeviceType } from '#helpers/userAgent';
import DownloadVCard from '../DownloadVCard';
import PostFeed from '../PostFeed';
import WebCardPostNavigation from '../WebCardPostNavigation';
import styles from './WebCard.css';
import type { WebCard, Media, PostWithCommentAndAuthor } from '@azzapp/data';
import type { PropsWithChildren } from 'react';

type Step1Props = PropsWithChildren<{
  webCard: WebCard;
  posts: PostWithCommentAndAuthor[];
  media: Media;
  cardBackgroundColor: string;
  lastModuleBackgroundColor: string;
  color: string | null;
  isShareBack?: boolean;
  handleCloseDownloadVCard: ({ token }: { token?: string }) => void;
}>;

const WebCard = ({
  webCard,
  posts,
  media,
  children,
  color,
  cardBackgroundColor,
  lastModuleBackgroundColor,
  isShareBack,
  handleCloseDownloadVCard,
}: Step1Props) => {
  const intl = useIntl();
  const deviceType = getDeviceType();
  const [display, setDisplay] = useState<'card' | 'posts'>('card');
  const [postsOpen, setPostsOpen] = useState(false);
  const searchParams = useSearchParams();

  const hasPosts = posts.length > 0;

  const hasContactCard = !!searchParams.get('c');

  return (
    <>
      <div className={styles.wrapper}>
        <div
          className={styles.background}
          style={{
            background: `
            linear-gradient(
              180deg,
              ${cardBackgroundColor} 0%,
              ${cardBackgroundColor} 50%,
              ${lastModuleBackgroundColor} 50%
              )
              `,
          }}
        />
        {posts.length > 0 && (
          <WebCardPostNavigation
            webCard={webCard}
            onClickCover={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onClickPosts={() => setPostsOpen(true)}
            className={cn(styles.postNavigation, {
              [styles.postNavigationHidden]: postsOpen,
            })}
            cover={media}
          />
        )}

        <main
          style={{ backgroundColor: cardBackgroundColor }}
          className={cn(styles.modules, {
            [styles.modulesBehind]: display === 'posts' && hasPosts,
            [styles.modulesWithPosts]: hasPosts && postsOpen,
          })}
        >
          {isShareBack && (
            <div className={styles.header}>
              <ContactSteps step={2} />
              <div className={styles.title}>
                {intl.formatMessage({
                  defaultMessage: 'Discover the WebCard',
                  id: '5RopcC',
                  description: 'Discover the WebCard title',
                })}
              </div>
              <Image
                style={{ marginTop: 20 }}
                src={arrows.src}
                alt=""
                width={24}
                height={35}
              />
            </div>
          )}
          <div
            style={{
              position: 'relative',
              marginTop: isShareBack ? 130 : 0,
            }}
          >
            <CoverRendererBackground media={media} />
            <div
              className={styles.coverContainer}
              style={{
                paddingTop: deviceType === DeviceType.DESKTOP ? 20 : 0,
                background: `linear-gradient(to bottom, transparent 0%, ${
                  cardBackgroundColor ?? '#FFF'
                } 95%)`,
              }}
            >
              <div
                style={{
                  flex: 1,
                  maxWidth: MAX_COVER_WIDTH,
                  boxShadow: '0px -15px 20px -6px rgba(0, 0, 0, 0.25)',
                  borderRadius: isShareBack ? 60 : 0,
                  borderBottomRightRadius: 0,
                  borderBottomLeftRadius: 0,
                  overflow: 'hidden',
                }}
              >
                <CoverRenderer webCard={webCard} media={media} priority />
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}
          >
            {children}
          </div>
        </main>
        {hasPosts && (
          <aside
            className={cn(styles.posts, {
              [styles.postsBehind]: display === 'card',
              [styles.postsClosed]: !postsOpen,
            })}
          >
            <div
              style={{
                width: '100px',
                background: `linear-gradient(to right, transparent 0%, ${color} 100%)`,
              }}
            />
            <div
              className={styles.postsContent}
              style={{
                backgroundColor: color ?? colors.white,
              }}
            >
              <PostFeed
                postsCount={webCard.nbPosts}
                defaultPosts={posts}
                media={media}
                webCard={webCard}
                onPressAuthor={() => {
                  setDisplay('card');
                  setPostsOpen(false);
                }}
                background={color ?? undefined}
                onClose={() => setPostsOpen(false)}
              />
            </div>
          </aside>
        )}

        {hasPosts && !hasContactCard && (
          <ButtonIcon
            Icon={FlipIcon}
            size={24}
            height={50}
            width={50}
            className={styles.switchContent}
            color="white"
            aria-label='Switch to "posts" / "card" view'
            onClick={() => {
              setDisplay(prevDisplay =>
                prevDisplay === 'card' ? 'posts' : 'card',
              );
              window.scrollTo({ top: 0 });
            }}
          />
        )}
      </div>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          width: '100%',
          zIndex: 5,
        }}
      >
        <DownloadVCard
          webCard={webCard}
          onClose={handleCloseDownloadVCard}
          step={2}
        />
      </div>
    </>
  );
};

export default WebCard;
