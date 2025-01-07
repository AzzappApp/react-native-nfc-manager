'use client';
import cn from 'classnames';
import Link from 'next/link';
import { useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { colors, getTextColor } from '@azzapp/shared/colorsHelpers';
import { CloseIcon, ShareIcon } from '#assets';
import { generateShareProfileLink } from '#helpers';
import { Button, ButtonIcon } from '#ui';
import DownloadAppModal from '#components/DownloadAppModal';
import ShareModal from '#components/ShareModal';
import styles from './PostFeed.css';
import type { ModalActions } from '#ui/Modal';
import type { Media, WebCard } from '@azzapp/data';

type PostFeedHeaderProps = {
  webCard: WebCard;
  postsCount: number;
  media: Media;
  onClose?: () => void;
  background?: string;
};

const PostFeedHeader = (props: PostFeedHeaderProps) => {
  const { webCard, postsCount, background, media, onClose } = props;
  const share = useRef<ModalActions>(null);
  const download = useRef<ModalActions>(null);

  const isLight = background && getTextColor(background) === colors.white;

  return (
    <div style={{ position: 'relative' }}>
      <div className={styles.header}>
        <ButtonIcon
          Icon={CloseIcon}
          onClick={onClose}
          className={styles.close}
          aria-label="close"
          color={background && getTextColor(background)}
        />
        <div className={styles.headerData}>
          <Link
            href={`/${webCard.userName}`}
            className={styles.headerName}
            style={{ color: background ? getTextColor(background) : undefined }}
          >
            {webCard.userName}
          </Link>
          <span className={styles.headerPostsCount}>
            <FormattedMessage
              defaultMessage="{postsCount} posts"
              id="axnG8m"
              description="Post feed count title"
              values={{
                postsCount,
              }}
            />
          </span>
          <Button
            onClick={() => download.current?.open()}
            size="small"
            className={cn(styles.headerButton, {
              [styles.headerButtonLight]: isLight,
            })}
            variant="primary"
          >
            <FormattedMessage
              defaultMessage="Follow"
              id="TBtX/a"
              description="Post feed follow title"
            />
          </Button>
        </div>
        <ButtonIcon
          Icon={ShareIcon}
          aria-label="Share post"
          onClick={() => share.current?.open()}
          color={background && getTextColor(background)}
          iconClassName={styles.share}
        />
      </div>
      <DownloadAppModal ref={download} webCard={webCard} media={media} />
      {webCard.userName && (
        <ShareModal
          ref={share}
          link={generateShareProfileLink(webCard.userName)}
        />
      )}
    </div>
  );
};

export default PostFeedHeader;
