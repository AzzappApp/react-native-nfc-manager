'use client';

import cx from 'classnames';
import parsePhoneNumberFromString from 'libphonenumber-js';
import { decompressFromEncodedURIComponent } from 'lz-string';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import { buildVCardFromSerializedContact } from '@azzapp/shared/vCardHelpers';
import { CloseIcon, InviteIcon } from '#assets';
import { ButtonIcon } from '#ui';
import { updateContactCardScanCounter } from '#app/actions/statisticsAction';
import ContactSteps from '#components/ContactSteps';
import {
  DeviceType,
  getDeviceType,
  isAppClipSupported,
} from '#helpers/userAgent';
import Avatar from '#ui/Avatar/Avatar';
import DownloadVCardLinkButton from '#ui/Button/DownloadVCardLinkButton';
import LinkButton from '#ui/Button/LinkButton';
import styles from './DownloadVCard.css';
import type { WebCard } from '@azzapp/data';

const AppIntlProvider = dynamic(
  () => import('../../components/AppIntlProvider'),
  {
    ssr: false,
  },
);

type DownloadVCardProps = {
  step: number;
  webCard: WebCard;
  startOpen?: boolean;
  onClose?: (data: { token?: string; avatarUrl?: string }) => void;
};

const DownloadVCard = ({
  step,
  webCard,
  startOpen,
  onClose,
}: DownloadVCardProps) => {
  const intl = useIntl();
  const [deviceType, setDeviceType] = useState<DeviceType | null>(null);
  const searchParams = useSearchParams();

  const [fileUrl, setFileUrl] = useState<string | undefined>();
  const ref = useRef<HTMLDivElement>(null);

  const [opened, setOpened] = useState(false);

  const [contact, setContact] = useState<{
    firstName: string;
    lastName: string;
    company: string;
    avatarUrl?: string;
    title?: string;
  }>();

  const loading = useRef(false);
  const [token, setToken] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [appClipIsSupported, setAppClipIsSupported] = useState(false);

  useEffect(() => {
    setAppClipIsSupported(isAppClipSupported());
    setDeviceType(getDeviceType());
  }, []);

  const processContact = useCallback(
    async (compressedContactCard: string) => {
      let contactData: string;
      let signature: string;
      let geolocation: {
        location: { latitude: number; longitude: number };
        address: {
          city: string;
          country: string;
          region: string;
          subregion: string;
        };
      };
      try {
        [contactData, signature, geolocation] = JSON.parse(
          decompressFromEncodedURIComponent(compressedContactCard),
        );

        const contactCard = parseContactCard(contactData);
        let phoneNumber;
        if (contactCard?.phoneNumbers?.[0]?.[1]) {
          phoneNumber = parsePhoneNumberFromString(
            contactCard?.phoneNumbers?.[0]?.[1],
          );
        }
        if (phoneNumber) {
          setPhoneNumber(phoneNumber.number);
        }
      } catch {
        return;
      }

      if (contactData && signature) {
        const res = await fetch('/api/verifySign', {
          body: JSON.stringify({
            signature,
            data: contactData,
            salt: webCard.userName,
            geolocation,
          }),
          method: 'POST',
        });
        if (res.ok) {
          const additionalData = await res.json();

          if (additionalData.avatarUrl) {
            const data = await fetch(additionalData.avatarUrl);
            const blob = await data.arrayBuffer();
            const base64 = Buffer.from(blob).toString('base64');

            additionalData.avatar = {
              type: data.headers.get('content-type')?.split('/')[1] ?? 'png',
              base64,
            };
          }

          const { vCard, contact } = await buildVCardFromSerializedContact(
            webCard.userName,
            contactData,
            additionalData,
          );

          if (contact.webCardId === webCard.id) {
            const isIE = !!(window as any)?.StyleMedia;

            setContact({
              ...contact,
              avatarUrl: additionalData.avatarUrl,
            });
            const file = new Blob([vCard.toString()], {
              type: isIE ? 'application/octet-stream' : 'text/vcard',
            });
            const fileURL = URL.createObjectURL(file);
            setFileUrl(fileURL);

            updateContactCardScanCounter(contact.profileId);
            setToken(additionalData.token);
            setDisplayName(additionalData.displayName);
          }
          if (startOpen) {
            setOpened(true);
          }
        }
      }
    },
    [webCard.userName, webCard.id, startOpen],
  );

  useEffect(() => {
    const compressedContactCard = searchParams.get('c');
    if (!compressedContactCard) {
      return;
    }

    if (!loading.current && !contact) {
      loading.current = true;
      processContact(compressedContactCard)
        .catch(() => void 0)
        .finally(() => {
          loading.current = false;
        });
    }
  }, [searchParams, contact, processContact]);

  const handleClose = useCallback(() => {
    setOpened(false);

    if (onClose) {
      onClose({ token });
    }
  }, [onClose, token]);

  const showAppClip = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const compressedContactCard = searchParams.get('c');
      if (!compressedContactCard) {
        return;
      }
      const appClipUrl = `${process.env.NEXT_PUBLIC_APPLE_APP_CLIP_URL}&u=${webCard.userName}&c=${compressedContactCard}`;
      // Open the App Clip URL
      window.location.href = appClipUrl;
    },
    [searchParams, webCard.userName],
  );

  const contactInitials = `${(contact?.firstName?.length ?? 0 > 0) ? contact?.firstName[0] : ''}${(contact?.lastName?.length ?? 0 > 0) ? contact?.lastName[0] : ''}`;

  return (
    <AppIntlProvider>
      <div
        ref={ref}
        className={cx(styles.dialog, {
          [styles.closedDialog]: !opened,
        })}
        role="dialog"
        aria-label={intl.formatMessage({
          defaultMessage: 'Modal with contact card download link',
          id: 'aumcS0',
          description: 'Download vCard modal aria label',
        })}
      >
        <div className={styles.avatarContainer}>
          {contact ? (
            contact?.avatarUrl ? (
              <Avatar
                variant="image"
                url={contact.avatarUrl}
                alt={displayName}
              />
            ) : (
              <Avatar variant="initials" initials={contactInitials} />
            )
          ) : null}
        </div>
        <div className={styles.message}>
          <div className={styles.userName}>{displayName}</div>
          {contact?.title && (
            <div className={styles.subtitle}>{contact?.title}</div>
          )}
          {contact?.company && (
            <div className={styles.subtitle}>{contact?.company}</div>
          )}
        </div>
        {step === 0 && <ContactSteps step={step} />}

        {appClipIsSupported ? (
          <LinkButton
            size="medium"
            onClick={showAppClip}
            className={styles.buttonLink}
          >
            <FormattedMessage
              defaultMessage="Create new contact"
              id="spJduZ"
              description="Save contact with AppClip modal message"
            />
          </LinkButton>
        ) : fileUrl && webCard.userName ? (
          <DownloadVCardLinkButton
            size="medium"
            href={fileUrl}
            className={styles.buttonLink}
            download={`${webCard.userName}${contact?.firstName.trim() ? `-${contact.firstName.trim()}` : ''}${contact?.lastName.trim() ? `-${contact.lastName.trim()}` : ''}.vcf`}
            userName={webCard.userName}
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
                  href={
                    new URL(process.env.NEXT_PUBLIC_DOWNLOAD_IOS_APP as string)
                  }
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
                  href={
                    new URL(
                      process.env.NEXT_PUBLIC_DOWNLOAD_ANDROID_APP as string,
                    )
                  }
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
      {contact && !opened && !contact.avatarUrl && (
        <ButtonIcon
          Icon={InviteIcon}
          size={24}
          height={50}
          width={50}
          className={styles.addContact}
          aria-label="Add contact"
          onClick={() => {
            setOpened(true);
          }}
        />
      )}
      {contact && !opened && contact.avatarUrl && (
        <div
          className={styles.addContact}
          style={{
            bottom: phoneNumber ? 75 : 15,
            right: 15,
          }}
        >
          <Image
            alt="add contact"
            src="/contact.svg"
            width={24}
            height={24}
            onClick={() => {
              setOpened(true);
            }}
          />
        </div>
      )}
      {phoneNumber && !opened && contact?.avatarUrl && (
        <Link
          href={`https://wa.me/${phoneNumber}?text=${intl.formatMessage({
            defaultMessage: 'Hello',
            id: 'xuXlIz',
            description: 'Hello message for whatsapp contact discussion button',
          })}`}
          target="_blank"
          className={styles.whatsappContainer}
        >
          {contact?.avatarUrl ? (
            <Avatar
              className={styles.whatsappAvatar}
              variant="image"
              url={contact?.avatarUrl}
              alt="avatar"
            />
          ) : (
            <Avatar
              className={styles.whatsappAvatar}
              variant="initials"
              initials={contactInitials}
            />
          )}
          <Image
            className={styles.whatsappIcon}
            alt="play store"
            src="/whatsapp.svg"
            width={19}
            height={19}
          />
        </Link>
      )}
    </AppIntlProvider>
  );
};

export default DownloadVCard;
