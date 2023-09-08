'use client';
import cn from 'classnames';
import { type HTMLAttributes, useEffect, useRef } from 'react';
import { ArrowRightIcon, ShareIcon } from '#assets';
import { generateShareProfileLink } from '#helpers';
import { ButtonIcon } from '#ui';
import ShareModal from '#components/ShareModal';
import CloudinaryImage from '#ui/CloudinaryImage';
import styles from './ProfilePostNavigation.css';
import type { ModalActions } from '#ui/Modal';
import type { Media } from '@azzapp/data/domains';

export type ProfilePostNavigationProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  postsCount: number;
  username: string;
  cover: Media;
  onClickPosts: () => void;
  onClickCover: () => void;
};

const ProfilePostNavigation = (props: ProfilePostNavigationProps) => {
  const {
    className,
    onClickPosts,
    onClickCover,
    cover,
    username,
    postsCount,
    ...others
  } = props;

  const modal = useRef<ModalActions>(null);
  const count = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = count.current;

    const onWheel = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      return false;
    };

    el?.addEventListener('wheel', onWheel);
    return () => el?.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <>
      <div {...others} className={cn(styles.navigation, className)}>
        <button
          className={cn(styles.clickable, styles.postsWrapper)}
          onClick={() => {
            setTimeout(() => {
              count.current?.scrollTo({ left: 0 });
            }, 300);
            onClickPosts();
          }}
          onMouseEnter={() => {
            count.current?.scrollTo({
              left: count.current?.scrollWidth ?? 0,
              behavior: 'smooth',
            });
          }}
          onMouseLeave={() => {
            count.current?.scrollTo({
              left: 0,
              behavior: 'smooth',
            });
          }}
        >
          <div className={styles.postsCountWrapper} ref={count}>
            <div className={styles.postsCountContent}>
              <span className={styles.postsCount}>{postsCount}</span>
              <div className={styles.open}>
                <ArrowRightIcon
                  color="black"
                  height={24}
                  width={24}
                  className={styles.openIcon}
                />
              </div>
            </div>
          </div>
          <span className={styles.text}>Posts</span>
        </button>
        <button className={styles.coverContainer} onClick={onClickCover}>
          <CloudinaryImage
            mediaId={cover.id}
            assetKind="cover"
            videoThumbnail={cover.kind === 'video'}
            alt="cover"
            fill
            className={styles.cover}
          />
        </button>
        <ButtonIcon
          Icon={ShareIcon}
          className={styles.clickable}
          onClick={() => modal.current?.open()}
        >
          <span className={styles.text}>Share</span>
        </ButtonIcon>
      </div>
      <ShareModal ref={modal} link={generateShareProfileLink(username)} />
    </>
  );
};

export default ProfilePostNavigation;
