import dynamic from 'next/dynamic';
import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from 'react';
import { FormattedMessage } from 'react-intl';
import { loadMoreLikesWebcards } from '#app/actions/profileActions';
import Modal from '#ui/Modal';
import { styles } from './PostLikesModal.css';
import PostLikesModalContent from './PostLikesModalContent';
import type { ModalActions, ModalProps } from '#ui/Modal';
import type { Media, WebCard } from '@azzapp/data';

type ShareModalProps = Omit<ModalProps, 'children'> & {
  postId: string;
};

const AppIntlProvider = dynamic(
  () => import('../../../../../components/AppIntlProvider'),
  {
    ssr: false,
  },
);

// eslint-disable-next-line react/display-name
const PostLikesModal = forwardRef<ModalActions, ShareModalProps>(
  (props, ref) => {
    const { postId, ...others } = props;

    const [isPending, startTransition] = useTransition();

    const [count, setCount] = useState(0);
    const [likes, setLikes] = useState<
      Array<WebCard & { media: Media | null }>
    >([]);

    const fetchMoreLikes = useCallback(() => {
      startTransition(async () => {
        if (isPending) return;

        const newLikes = await loadMoreLikesWebcards(
          postId,
          LIKES_BY_REQUEST,
          likes.length,
        );

        setLikes(prevLikes => {
          if (!prevLikes) return newLikes.webcards;
          return [...prevLikes, ...newLikes.webcards];
        });

        setCount(newLikes.count);
      });
    }, [isPending, likes.length, postId]);

    useEffect(() => {
      startTransition(async () => {
        const newLikes = await loadMoreLikesWebcards(
          postId,
          LIKES_BY_REQUEST,
          0,
        );

        setLikes(newLikes.webcards);
        setCount(newLikes.count);
      });
    }, [postId]);

    return (
      <AppIntlProvider>
        <Modal ref={ref} {...others} className={styles.modal}>
          <div className={styles.header}>
            <span className={styles.title}>
              <FormattedMessage
                defaultMessage="{likes} Likes"
                id="QR06rU"
                description="post likes modal title"
                values={{ likes: count }}
              />
            </span>
          </div>
          <PostLikesModalContent likes={likes} onFetchMore={fetchMoreLikes} />
        </Modal>
      </AppIntlProvider>
    );
  },
);

const LIKES_BY_REQUEST = 5;

export default PostLikesModal;
