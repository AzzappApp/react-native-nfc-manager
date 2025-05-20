'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { colors, getTextColor } from '@azzapp/shared/colorsHelpers';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import env from '#env';
import { DeviceType, getDeviceType } from '#helpers/userAgent';
import styles from './Footer.css';

const webSiteUrl = buildWebUrl();

type FooterProps = {
  backgroundColor: string;
  isAzzappPlus?: boolean;
};

const Footer = ({ backgroundColor, isAzzappPlus = false }: FooterProps) => {
  const [deviceType, setDeviceType] = useState<DeviceType>(DeviceType.DESKTOP);

  useEffect(() => {
    setDeviceType(getDeviceType());
  }, []);

  const color = getTextColor(
    backgroundColor === 'transparent' ? '#FFF' : backgroundColor,
  );
  const isLight = color === colors.white;

  return (
    <div
      className={styles.footer}
      style={{
        backgroundColor,
      }}
    >
      <div
        className={
          isAzzappPlus
            ? styles.poweredByContainerAzzappPlus
            : styles.poweredByContainer
        }
      >
        <div
          className={styles.poweredByLabel}
          style={{
            opacity: isAzzappPlus ? 0.3 : 0.5,
            color,
          }}
        >
          <FormattedMessage
            defaultMessage="Powered by"
            id="WTu1GU"
            description="Powered by in webcard footer"
          />
        </div>
        <Link
          href={webSiteUrl}
          target="_blank"
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Image
            src={isLight ? '/azzapp_white.svg' : '/azzapp_black.svg'}
            alt="Logo azzapp"
            width={isAzzappPlus ? 87 : 112}
            height={isAzzappPlus ? 18 : 23}
            style={{ opacity: isAzzappPlus ? 0.3 : 1 }}
            priority
          />
        </Link>
      </div>
      {!isAzzappPlus && (
        <>
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
                  priority
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
                  priority
                />
              </Link>
            )}
          </div>
          <Link
            href={webSiteUrl}
            target="_blank"
            className={styles.azzapLink}
            style={{
              opacity: isAzzappPlus ? 0.3 : 0.5,
              color,
            }}
          >
            <FormattedMessage
              defaultMessage="www.azzapp.com"
              id="HRVK4o"
              description="www.azzapp.com link in webcard footer"
            />
          </Link>
        </>
      )}
    </div>
  );
};

export default Footer;
