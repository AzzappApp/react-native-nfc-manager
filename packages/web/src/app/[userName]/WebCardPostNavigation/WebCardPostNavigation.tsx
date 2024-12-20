import cn from 'classnames';
import { type HTMLAttributes, useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { ArrowRightIcon, ShareIcon } from '#assets';
import { generateShareProfileLink } from '#helpers';
import { ButtonIcon } from '#ui';
import CoverRenderer from '#components/renderer/CoverRenderer';
import ShareModal from '#components/ShareModal';
import styles from './WebCardPostNavigation.css';
import type { ModalActions } from '#ui/Modal';
import type { Media, WebCard } from '@azzapp/data';

export type WebCardPostNavigationProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  webCard: WebCard;
  cover: Media;
  onClickPosts: () => void;
  onClickCover: () => void;
};

const ProfilePostNavigation = (props: WebCardPostNavigationProps) => {
  const { webCard, className, onClickPosts, onClickCover, cover, ...others } =
    props;

  const modal = useRef<ModalActions>(null);
  const count = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = count.current;

    const onWheel = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      return false;
    };

    el?.addEventListener('wheel', onWheel, { passive: true });
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
              <span className={styles.postsCount}>{webCard.nbPosts}</span>
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
          <span className={styles.text}>
            <FormattedMessage
              defaultMessage="{isPlural, plural,
      =0 {Posts}
      =1 {Post}
      other {Posts}
    }"
              id="I8SF0v"
              description="WebCardPostNavigation - Post label"
              values={{ isPlural: webCard.nbPosts }}
            />
          </span>
        </button>
        <button
          className={styles.coverContainer}
          onClick={onClickCover}
          aria-label="Go to top of WebCard"
        >
          <CoverRenderer
            width={40}
            media={cover}
            webCard={webCard}
            staticCover
          />
        </button>
        <ButtonIcon
          Icon={ShareIcon}
          className={styles.clickable}
          onClick={() => modal.current?.open()}
        >
          <span className={styles.text}>
            <FormattedMessage
              defaultMessage="Share"
              id="wMpjsx"
              description="WebCardPostNavigation - Share label"
            />
          </span>
        </ButtonIcon>
      </div>
      {webCard.userName ? (
        <ShareModal
          ref={modal}
          link={generateShareProfileLink(webCard.userName)}
        />
      ) : undefined}
    </>
  );
};

export default ProfilePostNavigation;
