'use client';

import * as Sentry from '@sentry/nextjs';
import { jwtDecode } from 'jwt-decode';
import { decompressFromEncodedURIComponent } from 'lz-string';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  displayName,
  formatContactInitial,
  parseContactCardWithAdditionalData,
} from '@azzapp/shared/contactCardHelpers';
import env from '#env';
import { updateWebCardViewsCounter } from '#app/actions/statisticsAction';
import ShareBackModal from '#components/ShareBackModal/ShareBackModal';
import CoverPreview from './CoverPreview';
import type { ModalActions } from '#ui/Modal';
import type { Media, WebCard } from '@azzapp/data';
import type { VerifySignToken } from '@azzapp/service/signatureServices';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';
import type { JwtPayload } from 'jwt-decode';
import type { PropsWithChildren } from 'react';

type CoverPageLayoutProps = PropsWithChildren<{
  webCard: WebCard;
  media: Media;
  userName: string;
  cardStyle: CardStyle;
}>;

const AppIntlProvider = dynamic(
  () => import('../../../components/AppIntlProvider'),
  {
    ssr: false,
  },
);

const CoverPageLayout = ({ webCard, media }: CoverPageLayoutProps) => {
  const searchParams = useSearchParams();
  const keyData = searchParams.get('k');
  const compressedContactCard = searchParams.get('c');

  const [contactCard, setContactCard] = useState<ContactCard>({});
  const [contactData, setContactData] = useState<{
    token: string;
    displayName: string;
    profileId: string;
    avatarUrl?: string;
  } | null>(null);

  // Process contact card or key data
  useEffect(() => {
    const processData = async () => {
      if (compressedContactCard) {
        try {
          const [contactCardData, signature, geolocation] = JSON.parse(
            decompressFromEncodedURIComponent(compressedContactCard),
          );

          const res = await fetch(
            `${env.NEXT_PUBLIC_API_ENDPOINT}/verifySign`,
            {
              body: JSON.stringify({
                signature,
                data: contactCardData,
                salt: webCard.userName,
                geolocation,
              }),
              method: 'POST',
            },
          );

          if (res.ok) {
            const additionalData = await res.json();
            const contact = parseContactCardWithAdditionalData(
              contactCardData,
              additionalData,
            );

            setContactCard(contact);
            setContactData({
              ...additionalData,
              profileId: contact.profileId || '',
            });
          }
        } catch (error) {
          Sentry.captureException(error);
        }
      } else if (keyData) {
        try {
          const [contactCardAccessId, key, geolocation] = JSON.parse(
            decompressFromEncodedURIComponent(keyData) ||
              atob(decodeURIComponent(keyData)),
          );

          const res = await fetch(
            `${env.NEXT_PUBLIC_API_ENDPOINT}/verifyQrCodeKey`,
            {
              body: JSON.stringify({
                contactCardAccessId,
                key,
                geolocation,
                userName: webCard.userName,
              }),
              method: 'POST',
            },
          );

          if (res.ok) {
            const {
              contactCard: contactCardData,
              avatarUrl,
              token,
              displayName,
              profileId,
            } = await res.json();
            setContactCard(contactCardData);
            setContactData({
              profileId,
              token,
              displayName,
              avatarUrl,
            });
          }
        } catch (error) {
          Sentry.captureException(error);
        }
      }
    };

    processData();
  }, [compressedContactCard, keyData, webCard.userName]);

  // Store share data when we have contact data

  useEffect(() => {
    if (contactData?.token) {
      const shareData = {
        timestamp: Date.now(),
        phoneNumbers: contactCard.phoneNumbers,
        contactInitials: formatContactInitial(
          contactCard.firstName,
          contactCard.lastName,
        ),
        avatarUrl: contactData.avatarUrl,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
      };
      sessionStorage.setItem(
        `azzapp_share_${webCard.userName}`,
        JSON.stringify(shareData),
      );
    }
  }, [
    contactData,
    contactCard.phoneNumbers,
    webCard.userName,
    contactCard.firstName,
    contactCard.lastName,
  ]);

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

  type DownloadVCardJwtPayload = JwtPayload & VerifySignToken;

  const handleCloseDownloadVCard = useCallback(() => {
    if (contactData?.token) {
      try {
        const tokenDecoded = jwtDecode<DownloadVCardJwtPayload>(
          contactData.token,
        );
        setContactDataVCard({
          userId: tokenDecoded.userId,
          webcardId: webCard?.id,
          avatarUrl: tokenDecoded.avatarUrl ?? '',
          isMultiUser: !!tokenDecoded.isMultiUser,
          token: contactData.token,
          firstName: tokenDecoded.firstName ?? '',
          lastName: tokenDecoded.lastName ?? '',
          company: tokenDecoded.company ?? '',
        });
      } catch (error) {
        Sentry.captureException(error);
      }

      setTimeout(() => {
        shareBackModal.current?.open();
      }, 450);
    }
  }, [contactData?.token, webCard?.id]);
  const router = useRouter();
  const onShareBackClose = useCallback(() => {
    const currentUrl = window.location.href;
    const urlWithoutShare = currentUrl.replace('/share/', '/');
    const urlWithoutParams = urlWithoutShare.split('?')[0];
    router.push(`${urlWithoutParams}?source=share`);
  }, [router]);

  useEffect(() => {
    if (webCard?.id) {
      updateWebCardViewsCounter(webCard?.id);
    }
  }, [webCard?.id]);

  if (!webCard.userName) {
    return undefined;
  }

  return (
    <AppIntlProvider>
      <CoverPreview
        media={media}
        webCard={webCard}
        handleCloseDownloadVCard={handleCloseDownloadVCard}
        contactData={contactData}
        contactCard={contactCard}
      />
      <ShareBackModal
        ref={shareBackModal}
        name={displayName(contactDataVCard, webCard)}
        initials={`${(contactDataVCard.firstName?.length ?? 0) > 0 && (contactDataVCard.lastName?.length ?? 0) > 0 ? `${contactDataVCard.firstName[0]}${contactDataVCard.lastName[0]}` : contactDataVCard.company ? contactDataVCard.company.slice(0, 2) : webCard.userName.slice(0, 2)}`}
        userId={contactDataVCard.userId}
        webcardId={webCard.id}
        avatarUrl={contactDataVCard.avatarUrl}
        token={contactDataVCard.token}
        onClose={onShareBackClose}
      />
    </AppIntlProvider>
  );
};

export default CoverPageLayout;
