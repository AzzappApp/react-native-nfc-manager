'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, ButtonIcon } from '#ui';
import { CloseIcon } from '#assets/icons';
import styles from './AndroidAppBanner.css';
import { vars } from './theme.css';

export const AndroidAppBanner = () => {
  const deferredPrompt = useRef<{ prompt: () => void } | null>(null);
  const [visible, setVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (
        'prompt' in e &&
        typeof e.prompt === 'function' &&
        !pathname.endsWith('/emailsignature') &&
        isAndroid
      ) {
        deferredPrompt.current = e as { prompt: () => void };
        setVisible(true);
      }
    });
  });

  return (
    <div
      style={{
        display: visible ? 'flex' : 'none',
        opacity: isClosing ? 0 : 1,
        transform: isClosing ? 'translateY(-100%)' : 'translateY(0)',
      }}
      className={styles.container}
    >
      <ButtonIcon
        onClick={() => {
          setIsClosing(true);
          setTimeout(() => {
            setVisible(false);
          }, 300);
        }}
        size={20}
        Icon={CloseIcon}
        className={styles.close}
        color={vars.color.grey300}
      />
      <img
        src="/android-chrome-512x512.png"
        alt="Android App Icon"
        className={styles.icon}
      />
      <div className={styles.content}>
        <FormattedMessage
          defaultMessage="Install the azzapp Android app for a better experience"
          id="/SoRFV"
          description="Android app install prompt message"
        />
      </div>

      <Button onClick={() => deferredPrompt.current?.prompt()}>
        <FormattedMessage
          defaultMessage="Install"
          id="1F7unB"
          description="Android app install prompt button"
        />
      </Button>
    </div>
  );
};
