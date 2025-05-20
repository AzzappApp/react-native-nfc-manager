'use client';

import cn from 'classnames';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { colors, getTextColor } from '@azzapp/shared/colorsHelpers';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import { FlipIcon, InviteIcon } from '#assets';
import env from '#env';
import { ButtonIcon } from '#ui';
import FullScreenOverlay from '#components/FullscreenOverlay/FullscreenOverlayContext';
import CoverRenderer from '#components/renderer/CoverRenderer';
import CoverRendererBackground from '#components/renderer/CoverRenderer/CoverRendererBackground';
import { DeviceType, getDeviceType } from '#helpers/userAgent';
import PostFeed from '../PostFeed';
import WebCardPostNavigation from '../WebCardPostNavigation';
import WhatsappButton from '../WhatsappButton';
import styles from './WebCard.css';
import type { WebCard, Media, PostWithCommentAndAuthor } from '@azzapp/data';
import type { CardStyle } from '@azzapp/shared/cardHelpers';

import type { PropsWithChildren } from 'react';

const webSiteUrl = buildWebUrl();

type Step1Props = PropsWithChildren<{
  webCard: WebCard;
  posts: PostWithCommentAndAuthor[];
  media: Media;
  cardBackgroundColor: string;
  lastModuleBackgroundColor: string;
  color: string | null;
  isAzzappPlus: boolean;
  cardStyle: CardStyle;
}>;

const WebCard = ({
  webCard,
  posts,
  media,
  children,
  color,
  cardBackgroundColor,
  lastModuleBackgroundColor,
  isAzzappPlus,
  cardStyle,
}: Step1Props) => {
  const [display, setDisplay] = useState<'card' | 'posts'>('card');
  const [postsOpen, setPostsOpen] = useState(false);
  const router = useRouter();

  const searchParams = useSearchParams();

  const hasPosts = posts.length > 0;

  const [shareData, setShareData] = useState<{
    avatarUrl?: string;
    contactInitials?: string;
    phoneNumbers: Array<{
      number: string;
      label: string;
    }>;
  }>();

  useEffect(() => {
    if (
      searchParams.get('source') === 'share' &&
      typeof window !== 'undefined'
    ) {
      const storedData = sessionStorage.getItem(
        `azzapp_share_${webCard.userName}`,
      );

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.expiresAt > Date.now()) {
          setShareData(parsedData);
        } else {
          // Clear expired data
          sessionStorage.removeItem(`azzapp_share_${webCard.userName}`);
        }
      }
    }
  }, [searchParams, webCard.userName]);

  return (
    <FullScreenOverlay cardStyle={cardStyle}>
      <div
        className={styles.wrapper}
        style={{
          backgroundColor: cardBackgroundColor,
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
          <div
            style={{
              position: 'relative',
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
              <div className={cn(styles.coverWrapper)}>
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
        <div className={styles.floatingButtonsContainer}>
          {shareData && shareData.phoneNumbers.length > 0 && !postsOpen && (
            <WhatsappButton
              phoneNumbers={shareData.phoneNumbers}
              contactInitials={shareData.contactInitials}
              avatarUrl={shareData.avatarUrl}
            />
          )}
          {shareData && !postsOpen && !shareData.avatarUrl && (
            <ButtonIcon
              Icon={InviteIcon}
              size={24}
              height={50}
              width={50}
              className={styles.addContact}
              aria-label="Add contact"
              onClick={() => {
                router.back();
              }}
            />
          )}
          {shareData && !postsOpen && shareData && (
            <div
              className={styles.addContact}
              onClick={() => {
                router.back();
              }}
            >
              <Image
                alt="add contact"
                src="/contact.svg"
                width={20}
                height={20}
              />
            </div>
          )}
          {hasPosts && (
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
          href={webSiteUrl}
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
                href={new URL(env.NEXT_PUBLIC_DOWNLOAD_IOS_APP)}
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
                href={new URL(env.NEXT_PUBLIC_DOWNLOAD_ANDROID_APP)}
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
            href={webSiteUrl}
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
