'use client';

import cx from 'classnames';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  buildVCardFileName,
  formatContactInitial,
} from '@azzapp/shared/contactCardHelpers';

import { buildVCardFromContactCard } from '@azzapp/shared/vCardHelpers';
import { CloseIcon } from '#assets';
import env from '#env';
import { ButtonIcon } from '#ui';
import { updateContactCardScanCounter } from '#app/actions/statisticsAction';
import ContactSteps from '#components/ContactSteps';
import { DeviceType, getDeviceType } from '#helpers/userAgent';
import Avatar from '#ui/Avatar/Avatar';
import DownloadVCardLinkButton from '#ui/Button/DownloadVCardLinkButton';
import styles from './DownloadVCard.css';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';

type DownloadVCardProps = {
  step: number;
  userName: string;
  startOpen?: boolean;
  onClose: () => void;
  contactCard: ContactCard;
  contactData: {
    token: string;
    displayName: string;
    avatarUrl?: string;
    profileId: string;
  };
};

const DownloadVCard = ({
  step,
  userName,
  startOpen,
  onClose,
  contactCard,
  contactData,
}: DownloadVCardProps) => {
  const intl = useIntl();
  const deviceType = getDeviceType();

  const [fileUrl, setFileUrl] = useState<string | undefined>();
  const ref = useRef<HTMLDivElement>(null);

  const [opened, setOpened] = useState(startOpen);
  const loading = useRef(false);

  const processVCard = useCallback(async () => {
    try {
      let avatar;
      if (contactData.avatarUrl) {
        const data = await fetch(contactData.avatarUrl);
        const blob = await data.arrayBuffer();
        const base64 = Buffer.from(blob).toString('base64');

        avatar = {
          type: data.headers.get('content-type')?.split('/')[1] ?? 'png',
          base64,
        };
      }

      const { vCard } = await buildVCardFromContactCard(
        userName,
        contactData.profileId,
        contactCard,
        avatar,
      );

      const isIE = !!(window as any)?.StyleMedia;

      const file = new Blob([vCard.toString()], {
        type: isIE ? 'application/octet-stream' : 'text/vcard',
      });
      const fileURL = URL.createObjectURL(file);
      setFileUrl(fileURL);

      if (step === 0) {
        // No need to count views on other steps
        updateContactCardScanCounter(contactData.profileId);
      }
    } catch {
      return;
    }
  }, [
    contactCard,
    contactData.avatarUrl,
    contactData.profileId,
    step,
    userName,
  ]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        if (!loading.current && contactCard) {
          loading.current = true;
          processVCard()
            .catch(() => void 0)
            .finally(() => {
              setOpened(true);
              loading.current = false;
            });
        }
      }
    };

    handlePageShow({ persisted: true } as PageTransitionEvent);

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [contactCard, processVCard]);

  const handleClose = useCallback(() => {
    setOpened(false);

    if (onClose) {
      onClose();
    }
  }, [onClose]);

  return (
    <>
      <div
        ref={ref}
        className={cx(
          styles.dialog,
          opened ? styles.openDialog : styles.closedDialog,
        )}
        role="dialog"
        aria-label={intl.formatMessage({
          defaultMessage: 'Modal with contact card download link',
          id: 'aumcS0',
          description: 'Download vCard modal aria label',
        })}
      >
        <div className={styles.avatarContainer}>
          {contactData ? (
            contactData?.avatarUrl ? (
              <Avatar
                variant="image"
                url={contactData.avatarUrl}
                alt={contactData.displayName ?? ''}
              />
            ) : (
              <Avatar
                variant="initials"
                initials={formatContactInitial(
                  contactCard.firstName,
                  contactCard.lastName,
                )}
              />
            )
          ) : null}
        </div>
        <div className={styles.message}>
          <div className={styles.userName}>{contactData.displayName}</div>
          {contactCard?.title && (
            <div className={styles.subtitle}>{contactCard?.title}</div>
          )}
          {contactCard?.company && (
            <div className={styles.subtitle}>{contactCard?.company}</div>
          )}
        </div>
        {step === 0 && <ContactSteps step={step} />}
        {fileUrl && userName ? (
          <DownloadVCardLinkButton
            size="medium"
            href={fileUrl}
            className={styles.buttonLink}
            download={buildVCardFileName(userName, contactCard)}
            userName={userName}
            onClick={handleClose}
          >
            <FormattedMessage
              defaultMessage="Create new contact"
              id="ANfVcR"
              description="Download vCard modal message"
            />
          </DownloadVCardLinkButton>
        ) : null}
        {step !== 0 && (
          <div className={styles.bottomContainer}>
            <div className={styles.poweredByContainer}>
              <div className={styles.poweredByLabel}>
                <FormattedMessage
                  defaultMessage="Powered by"
                  id="1Kt5MY"
                  description="Powered by in Download Vcard bottom box"
                />
              </div>
              <Image
                src="/logo-v2.svg"
                alt="Logo azzapp"
                width={101}
                height={21}
              />
            </div>
            <div className={styles.storeContainer}>
              {(deviceType === DeviceType.IOS ||
                deviceType === DeviceType.DESKTOP) && (
                <Link
                  href={new URL(env.NEXT_PUBLIC_DOWNLOAD_IOS_APP)}
                  target="_blank"
                >
                  <Image
                    alt="app store"
                    src="/appstore.svg"
                    width={124}
                    height={36}
                  />
                </Link>
              )}
              {(deviceType === DeviceType.ANDROID ||
                deviceType === DeviceType.DESKTOP) && (
                <Link
                  href={new URL(env.NEXT_PUBLIC_DOWNLOAD_ANDROID_APP)}
                  target="_blank"
                >
                  <Image
                    alt="play store"
                    src="/googleplay.svg"
                    width={124}
                    height={36}
                  />
                </Link>
              )}
            </div>
          </div>
        )}

        <ButtonIcon
          onClick={handleClose}
          size={30}
          Icon={CloseIcon}
          className={styles.closeButton}
        />
      </div>
    </>
  );
};

export default DownloadVCard;
