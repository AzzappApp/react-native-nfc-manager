'use client';
import * as Sentry from '@sentry/nextjs';
import cn from 'classnames';
import { jwtDecode } from 'jwt-decode';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { colors } from '@azzapp/shared/colorsHelpers';
import { FlipIcon } from '#assets';
import { ButtonIcon } from '#ui';
import { updateWebCardViewsCounter } from '#app/actions/statisticsAction';
import ShareBackModal from '#components/ShareBackModal/ShareBackModal';
import { displayName } from '#helpers/contactCardHelpers';
import DownloadVCard from './DownloadVCard';
import PostFeed from './PostFeed';
import styles from './WebCardPage.css';
import WebCardPostNavigation from './WebCardPostNavigation';
import type { ModalActions } from '#ui/Modal';
import type { Media, PostWithCommentAndAuthor, WebCard } from '@azzapp/data';
import type { JwtPayload } from 'jwt-decode';
import type { PropsWithChildren } from 'react';

type ProfilePageLayoutProps = PropsWithChildren<{
  webCard: WebCard;
  cover: React.ReactNode;
  posts: PostWithCommentAndAuthor[];
  media: Media;
  cardBackgroundColor: string;
  lastModuleBackgroundColor: string;
  userName: string;
  color: string | null;
}>;

const WebCardPageLayout = (props: ProfilePageLayoutProps) => {
  const {
    webCard,
    children,
    cover,
    posts,
    media,
    cardBackgroundColor,
    lastModuleBackgroundColor,
    color,
  } = props;
  const [display, setDisplay] = useState<'card' | 'posts'>('card');
  const [postsOpen, setPostsOpen] = useState(false);

  const [contactDataVCard, setContactDataVCard] = useState({
    userId: '',
    webcardId: '',
    avatarUrl: '',
    token: '',
    firstName: '',
    lastName: '',
    company: '',
    isMultiUser: false,
  });

  const shareBackModal = useRef<ModalActions>(null);

  const hasPosts = posts.length > 0;

  type DownloadVCardJwtPayload = JwtPayload & {
    userId: string;
    avatarUrl?: string;
    isMultiUser: boolean;
    firstName?: string;
    lastName?: string;
    company?: string;
  };

  const handleCloseDownloadVCard = ({ token }: { token?: string }) => {
    if (token) {
      try {
        const tokenDecoded = jwtDecode<DownloadVCardJwtPayload>(token);
        setContactDataVCard({
          userId: tokenDecoded.userId,
          webcardId: webCard?.id,
          avatarUrl: tokenDecoded.avatarUrl ?? '',
          isMultiUser: tokenDecoded.isMultiUser,
          token,
          firstName: tokenDecoded.firstName ?? '',
          lastName: tokenDecoded.lastName ?? '',
          company: tokenDecoded.company ?? '',
        });
      } catch (error) {
        Sentry.captureException(
          new Error(
            `Error while decoding token: 
            ${error}`,
          ),
        );
      }

      // Opening of the shareback modal after 450ms depending on the Save CC closing animation(see issue #3305)
      setTimeout(() => {
        shareBackModal.current?.open();
      }, 450);
    }
  };

  useEffect(() => {
    if (webCard?.id) {
      updateWebCardViewsCounter(webCard?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchParams = useSearchParams();
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
          // TODO card.backgroundColor
          style={{ backgroundColor: '#FFF' }}
          className={cn(styles.modules, {
            [styles.modulesBehind]: display === 'posts' && hasPosts,
            [styles.modulesWithPosts]: hasPosts && postsOpen,
          })}
        >
          {cover}
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
        <DownloadVCard webCard={webCard} onClose={handleCloseDownloadVCard} />
      </div>
      <ShareBackModal
        ref={shareBackModal}
        name={displayName(contactDataVCard, webCard)}
        initials={`${(contactDataVCard.firstName?.length ?? 0) > 0 && (contactDataVCard.lastName?.length ?? 0) > 0 ? `${contactDataVCard.firstName[0]}${contactDataVCard.lastName[0]}` : contactDataVCard.company ? contactDataVCard.company.slice(0, 2) : webCard.userName.slice(0, 2)}`}
        userId={contactDataVCard.userId}
        webcardId={webCard.id}
        avatarUrl={contactDataVCard.avatarUrl}
        token={contactDataVCard.token}
      />
    </>
  );
};

export default WebCardPageLayout;
