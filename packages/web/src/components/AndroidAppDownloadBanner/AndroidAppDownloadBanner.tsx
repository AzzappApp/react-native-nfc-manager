'use client';
import cn from 'classnames';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { CloseIcon } from '#assets';
import { ButtonIcon } from '#ui';
import logo from '#assets/images/logo-black.png';
import LinkButton from '#ui/Button/LinkButton';
import styles from './AndroidAppDownloadBanner.css';

const AndroidAppDownloadBanner = () => {
  const [show, setShow] = useState(false);
  const deferred = useRef<any>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      deferred.current = e;
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  const onClose = useCallback(() => {
    setShow(false);
  }, []);

  const onShow = useCallback(() => {
    deferred.current?.prompt?.();

    deferred.current?.userChoice?.then(() => {
      deferred.current = null;
      setShow(false);
    });
  }, []);

  return (
    <div
      className={cn(styles.container, {
        [styles.containerHidden]: !show,
      })}
    >
      <ButtonIcon
        size={30}
        Icon={CloseIcon}
        color="#D4D4D4"
        onClick={onClose}
      />
      <div className={styles.logo}>
        <Image src={logo} alt="azzap logo" height={32} width={32} />
      </div>
      <div className={styles.texts}>
        <span className={styles.title}>
          <FormattedMessage
            defaultMessage="Azzapp"
            id="x5nDs6"
            description="Title in android install banner"
          />
        </span>
        <span className={styles.subTitle}>
          <FormattedMessage
            defaultMessage="Azzapp"
            id="ZVmnq0"
            description="First subtitle in android install banner"
          />
        </span>
        <span className={styles.subTitle}>
          <FormattedMessage
            defaultMessage="DOWNLOAD in the Play Store"
            id="QGiLVn"
            description="Second subtitle in android install banner"
          />
        </span>
      </div>
      <LinkButton className={styles.link} type="secondary" onClick={onShow}>
        <FormattedMessage
          defaultMessage="Show"
          id="bhnp/z"
          description="Show android install banner"
        />
      </LinkButton>
    </div>
  );
};

export default AndroidAppDownloadBanner;
