'use client';
import * as Sentry from '@sentry/nextjs';
import cn from 'classnames';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useRef, useState } from 'react';
import { FlipIcon } from '#assets';
import { ButtonIcon } from '#ui';
import { updateWebCardViewsCounter } from '#app/actions/statisticsAction';
import ShareBackModal from '#components/ShareBackModal/ShareBackModal';
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
  } = props;
  const [display, setDisplay] = useState<'card' | 'posts'>('card');
  const [postsOpen, setPostsOpen] = useState(false);

  const [contactDataVCard, setContactDataVCard] = useState({
    userId: '',
    avatarUrl: '',
    token: '',
    firstName: '',
    lastName: '',
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
  };

  const handleCloseDownloadVCard = ({ token }: { token?: string }) => {
    if (token) {
      try {
        const tokenDecoded = jwtDecode<DownloadVCardJwtPayload>(token);
        setContactDataVCard({
          userId: tokenDecoded.userId,
          avatarUrl: tokenDecoded.avatarUrl ?? '',
          isMultiUser: tokenDecoded.isMultiUser,
          token,
          firstName: tokenDecoded.firstName ?? '',
          lastName: tokenDecoded.lastName ?? '',
        });
      } catch (error) {
        Sentry.captureException(
          new Error(
            `Error while decoding token: 
            ${error}`,
          ),
        );
      }

      // Open share back modal after 1s (see issue #3305)
      setTimeout(() => {
        shareBackModal.current?.open();
      }, 1000);
    }
  };

  useEffect(() => {
    if (webCard?.id) {
      updateWebCardViewsCounter(webCard?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
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
            <PostFeed
              postsCount={webCard.nbPosts}
              defaultPosts={posts}
              media={media}
              webCard={webCard}
              onPressAuthor={() => {
                setDisplay('card');
                setPostsOpen(false);
              }}
              onClose={() => setPostsOpen(false)}
            />
          </aside>
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

        <DownloadVCard webCard={webCard} onClose={handleCloseDownloadVCard} />
      </div>
      <ShareBackModal
        ref={shareBackModal}
        fullname={`${contactDataVCard.firstName} ${contactDataVCard.lastName}`}
        initials={`${(contactDataVCard.firstName?.length ?? 0) > 0 && (contactDataVCard.lastName?.length ?? 0) > 0 ? `${contactDataVCard.firstName[0]}${contactDataVCard.lastName[0]}` : webCard.companyName ? webCard.companyName.slice(0, 2) : webCard.userName.slice(0, 2)}`}
        userId={contactDataVCard.userId}
        avatarUrl={contactDataVCard.avatarUrl}
        token={contactDataVCard.token}
        isMultiUser={contactDataVCard.isMultiUser}
      />
    </>
  );
};

export default WebCardPageLayout;
