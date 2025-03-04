'use client';

import * as Sentry from '@sentry/nextjs';
import { jwtDecode } from 'jwt-decode';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { updateWebCardViewsCounter } from '#app/actions/statisticsAction';
import ShareBackModal from '#components/ShareBackModal/ShareBackModal';
import { displayName } from '#helpers/contactCardHelpers';
import DisplayWebCard from './WebCard';
import WebCardPreview from './WebCardPreview';
import type { ModalActions } from '#ui/Modal';
import type { Media, PostWithCommentAndAuthor, WebCard } from '@azzapp/data';
import type { JwtPayload } from 'jwt-decode';
import type { PropsWithChildren } from 'react';

type WebCardPageLayoutProps = PropsWithChildren<{
  webCard: WebCard;
  posts: PostWithCommentAndAuthor[];
  media: Media;
  cardBackgroundColor: string;
  lastModuleBackgroundColor: string;
  userName: string;
  color: string | null;
  isAzzappPlus: boolean;
}>;

const WebCardPageLayout = (props: WebCardPageLayoutProps) => {
  const {
    webCard,
    children,
    posts,
    media,
    cardBackgroundColor,
    lastModuleBackgroundColor,
    color,
    isAzzappPlus,
  } = props;
  const searchParams = useSearchParams();
  const isShareBack = !!searchParams.get('c') || !!searchParams.get('token');
  const mode = searchParams.get('mode');
  const [step, setStep] = useState(() => (isShareBack ? 0 : 2));
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

  type DownloadVCardJwtPayload = JwtPayload & {
    userId: string;
    avatarUrl?: string;
    isMultiUser: boolean;
    firstName?: string;
    lastName?: string;
    company?: string;
  };

  const handleCloseDownloadVCard = useCallback(
    ({ token }: { token?: string }) => {
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
    },
    [webCard?.id],
  );

  const [isModalReady, setIsModalReady] = useState(false);

  const handleModalReady = () => {
    setIsModalReady(true);
  };

  useEffect(() => {
    // call directly shareback (use when coming back from AppClip)
    if (mode === 'shareback' && isModalReady) {
      const token = searchParams.get('token');
      if (token) {
        handleCloseDownloadVCard({ token });
      }
    }
  }, [handleCloseDownloadVCard, isModalReady, mode, searchParams]);

  const onShareBackClose = () => {
    setStep(2);
  };

  useEffect(() => {
    if (webCard?.id) {
      updateWebCardViewsCounter(webCard?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!webCard.userName) {
    return undefined;
  }

  return (
    <>
      {step === 0 && (
        <WebCardPreview
          media={media}
          webCard={webCard}
          cardBackgroundColor={cardBackgroundColor}
          handleCloseDownloadVCard={handleCloseDownloadVCard}
        />
      )}
      {step === 2 && (
        <DisplayWebCard
          webCard={webCard}
          posts={posts}
          media={media}
          cardBackgroundColor={cardBackgroundColor}
          lastModuleBackgroundColor={lastModuleBackgroundColor}
          color={color}
          handleCloseDownloadVCard={handleCloseDownloadVCard}
          isShareBack={isShareBack}
          isAzzappPlus={isAzzappPlus}
        >
          {children}
        </DisplayWebCard>
      )}
      <ShareBackModal
        ref={shareBackModal}
        name={displayName(contactDataVCard, webCard)}
        initials={`${(contactDataVCard.firstName?.length ?? 0) > 0 && (contactDataVCard.lastName?.length ?? 0) > 0 ? `${contactDataVCard.firstName[0]}${contactDataVCard.lastName[0]}` : contactDataVCard.company ? contactDataVCard.company.slice(0, 2) : webCard.userName.slice(0, 2)}`}
        userId={contactDataVCard.userId}
        webcardId={webCard.id}
        avatarUrl={contactDataVCard.avatarUrl}
        token={contactDataVCard.token}
        onClose={onShareBackClose}
        onReady={handleModalReady}
      />
    </>
  );
};

export default WebCardPageLayout;
