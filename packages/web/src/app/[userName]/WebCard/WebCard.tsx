'use client';

import cn from 'classnames';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { colors, getTextColor } from '@azzapp/shared/colorsHelpers';
import arrows from '@azzapp/web/public/arrows@3x.png';
import { FlipIcon } from '#assets';
import { ButtonIcon } from '#ui';
import ContactSteps from '#components/ContactSteps';
import FullScreenOverlay from '#components/FullscreenOverlay/FullscreenOverlayContext';
import CoverRenderer from '#components/renderer/CoverRenderer';
import CoverRendererBackground from '#components/renderer/CoverRenderer/CoverRendererBackground';
import { DeviceType, getDeviceType } from '#helpers/userAgent';
import DownloadVCard from '../DownloadVCard';
import PostFeed from '../PostFeed';
import WebCardPostNavigation from '../WebCardPostNavigation';
import styles from './WebCard.css';
import type { WebCard, Media, PostWithCommentAndAuthor } from '@azzapp/data';
import type { CardStyle } from '@azzapp/shared/cardHelpers';

import type { PropsWithChildren } from 'react';

const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || 'https://www.azzapp.com';

type Step1Props = PropsWithChildren<{
  webCard: WebCard;
  posts: PostWithCommentAndAuthor[];
  media: Media;
  cardBackgroundColor: string;
  lastModuleBackgroundColor: string;
  color: string | null;
  isAzzappPlus: boolean;
  isShareBack?: boolean;
  cardStyle: CardStyle;
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
  isAzzappPlus,
  cardStyle,
  handleCloseDownloadVCard,
}: Step1Props) => {
  const intl = useIntl();
  const [display, setDisplay] = useState<'card' | 'posts'>('card');
  const [postsOpen, setPostsOpen] = useState(false);
  const searchParams = useSearchParams();

  const hasPosts = posts.length > 0;

  const hasContactCard = !!searchParams.get('c');

  return (
    <FullScreenOverlay cardStyle={cardStyle}>
      <div
        className={styles.wrapper}
        style={{
          backgroundColor: !isShareBack ? cardBackgroundColor : 'transparent',
        }}
      >
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
                background: `linear-gradient(to bottom, transparent 0%, ${
                  cardBackgroundColor ?? '#FFF'
                } 95%)`,
              }}
            >
              <div
                className={cn(
                  styles.coverWrapper,
                  isShareBack && styles.coverSharebackWrapper,
                )}
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
              backgroundColor: cardBackgroundColor,
            }}
          >
            {children}
            <Footer
              backgroundColor={lastModuleBackgroundColor || cardBackgroundColor}
              isAzzappPlus={isAzzappPlus}
            />
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
    </FullScreenOverlay>
  );
};

const Footer = ({
  backgroundColor,
  isAzzappPlus = false,
}: {
  backgroundColor: string;
  isAzzappPlus?: boolean;
}) => {
  const [deviceType, setDeviceType] = useState<DeviceType>(DeviceType.DESKTOP);

  useEffect(() => {
    setDeviceType(getDeviceType());
  }, []);

  const color = getTextColor(
    backgroundColor === 'transparent' ? '#FFF' : backgroundColor,
  );
  const isLight = color === colors.white;

  return (
    <div
      className={styles.footer}
      style={{
        backgroundColor,
      }}
    >
      <div
        className={cn(
          isAzzappPlus
            ? styles.poweredByContainerAzzappPlus
            : styles.poweredByContainer,
        )}
      >
        <div
          className={styles.poweredByLabel}
          style={{
            opacity: isAzzappPlus ? 0.3 : 0.5,
            color,
          }}
        >
          <FormattedMessage
            defaultMessage="Powered by"
            id="WTu1GU"
            description="Powered by in webcard footer"
          />
        </div>
        <Link
          href={NEXT_PUBLIC_URL}
          target="_blank"
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Image
            src={isLight ? '/azzapp_white.svg' : '/azzapp_black.svg'}
            alt="Logo azzapp"
            width={isAzzappPlus ? 87 : 112}
            height={isAzzappPlus ? 18 : 23}
            style={{ opacity: isAzzappPlus ? 0.3 : 1 }}
          />
        </Link>
      </div>
      {!isAzzappPlus && (
        <>
          <div className={styles.storeContainer}>
            {(deviceType === DeviceType.IOS ||
              deviceType === DeviceType.DESKTOP) && (
              <Link
                href={
                  new URL(process.env.NEXT_PUBLIC_DOWNLOAD_IOS_APP as string)
                }
                target="_blank"
              >
                <Image
                  alt="app store"
                  src="/appstore.svg"
                  width={124}
                  height={36}
                />
              </Link>
            )}
            {(deviceType === DeviceType.ANDROID ||
              deviceType === DeviceType.DESKTOP) && (
              <Link
                href={
                  new URL(
                    process.env.NEXT_PUBLIC_DOWNLOAD_ANDROID_APP as string,
                  )
                }
                target="_blank"
              >
                <Image
                  alt="play store"
                  src="/googleplay.svg"
                  width={124}
                  height={36}
                />
              </Link>
            )}
          </div>
          <Link
            href={NEXT_PUBLIC_URL}
            target="_blank"
            className={styles.azzapLink}
            style={{
              opacity: isAzzappPlus ? 0.3 : 0.5,
              color,
            }}
          >
            <FormattedMessage
              defaultMessage="www.azzapp.com"
              id="HRVK4o"
              description="www.azzapp.com link in webcard footer"
            />
          </Link>
        </>
      )}
    </div>
  );
};

export default WebCard;
