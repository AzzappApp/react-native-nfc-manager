'use client';
import cn from 'classnames';
import { useState } from 'react';
import { FlipIcon } from '#assets';
import { ButtonIcon } from '#ui';
import DownloadVCard from './DownloadVCard';
import PostFeed from './PostFeed';
import styles from './ProfilePage.css';
import ProfilePostNavigation from './ProfilePostNavigation';
import type {
  Card,
  Profile,
  Media,
  PostWithCommentAndAuthor,
} from '@azzapp/data/domains';

type ProfilePageLayoutProps = {
  card: Card;
  profile: Profile;
  modules: React.ReactNode;
  cover: React.ReactNode;
  posts: PostWithCommentAndAuthor[];
  postsCount: number;
  media: Media;
};

const ProfilePageLayout = (props: ProfilePageLayoutProps) => {
  const { card, profile, modules, cover, posts, postsCount, media } = props;
  const [display, setDisplay] = useState<'card' | 'posts'>('card');
  const [postsOpen, setPostsOpen] = useState(false);

  const hasPosts = posts.length > 0;

  return (
    <div className={styles.wrapper}>
      <ProfilePostNavigation
        postsCount={postsCount}
        onClickCover={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onClickPosts={() => setPostsOpen(true)}
        className={cn(styles.postNavigation, {
          [styles.postNavigationHidden]: postsOpen,
        })}
        cover={media}
        username={profile.userName}
      />
      <main
        style={{ backgroundColor: card.backgroundColor ?? '#FFF' }}
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
            postsCount={postsCount}
            defaultPosts={posts}
            media={media}
            profile={profile}
            onClose={() => setPostsOpen(false)}
          />
        </aside>
      )}

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
        }}
      />
      <DownloadVCard
        profileId={profile.id}
        userName={profile.userName}
        profile={profile}
      />
    </div>
  );
};

export default ProfilePageLayout;
