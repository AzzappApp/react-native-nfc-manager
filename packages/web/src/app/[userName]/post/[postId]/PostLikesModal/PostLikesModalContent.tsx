import Link from 'next/link';
import { useScrollEnd } from '#hooks';
import CoverRenderer from '#components/renderer/CoverRenderer';
import { generateShareProfileLink } from '#helpers/link';
import { styles } from './PostLikesModal.css';
import type { Media, WebCard } from '@azzapp/data';

type Props = {
  likes: Array<WebCard & { media: Media | null }>;
  onFetchMore: () => void;
};

const PostLikesModalContent = ({ likes, onFetchMore }: Props) => {
  const scroll = useScrollEnd<HTMLDivElement>(() => {
    onFetchMore();
  }, [onFetchMore]);

  return (
    <div className={styles.likes} ref={scroll}>
      {likes.map(like => {
        const { media, ...webcard } = like;
        if (!webcard.userName) return undefined;
        return (
          <div key={like.id} className={styles.like}>
            {media && (
              <div className={styles.cover}>
                <CoverRenderer
                  width={35}
                  media={media}
                  webCard={webcard}
                  staticCover
                />
              </div>
            )}
            <Link
              className={styles.username}
              href={generateShareProfileLink(webcard.userName)}
            >
              {webcard.userName}
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default PostLikesModalContent;
