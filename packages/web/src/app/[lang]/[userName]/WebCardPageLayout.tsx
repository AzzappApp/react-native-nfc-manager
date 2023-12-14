'use client';
import cn from 'classnames';
import { useEffect, useState } from 'react';
import { FlipIcon } from '#assets';
import { ButtonIcon } from '#ui';
import { updateWebCardViewsCounter } from '#app/actions/statisticsAction';
import DownloadVCard from './DownloadVCard';
import PostFeed from './PostFeed';
import styles from './WebCardPage.css';
import WebCardPostNavigation from './WebCardPostNavigation';
import type {
  Media,
  PostWithCommentAndAuthor,
  WebCard,
} from '@azzapp/data/domains';

type ProfilePageLayoutProps = {
  webCard: WebCard;
  modules: React.ReactNode;
  cover: React.ReactNode;
  posts: PostWithCommentAndAuthor[];
  media: Media;
  cardBackgroundColor: string;
  lastModuleBackgroundColor: string;
  userName: string;
};

const WebCardPageLayout = (props: ProfilePageLayoutProps) => {
  const {
    webCard,
    modules,
    cover,
    posts,
    media,
    cardBackgroundColor,
    lastModuleBackgroundColor,
    userName,
  } = props;
  const [display, setDisplay] = useState<'card' | 'posts'>('card');
  const [postsOpen, setPostsOpen] = useState(false);

  useEffect(() => {
    if (userName !== userName.toLowerCase()) {
      window.history.pushState({}, '', userName.toLowerCase());
    }
  }, [userName]);

  const hasPosts = posts.length > 0;

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
            {modules}
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
            onClick={() => {
              setDisplay(prevDisplay =>
                prevDisplay === 'card' ? 'posts' : 'card',
              );
              window.scrollTo({ top: 0 });
            }}
          />
        )}
        <DownloadVCard webCard={webCard} />
      </div>
    </>
  );
};

export default WebCardPageLayout;
