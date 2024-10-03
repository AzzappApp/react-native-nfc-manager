'use client';
import Image from 'next/image';
import React from 'react';
import { useIntl } from 'react-intl';
import desktop from '#assets/images/desktop.png';
import styles from './page.css';

const CannotCreateEmailSignature = () => {
  const intl = useIntl();
  return (
    <div className={styles.mobileBodyContainer}>
      <Image
        src={desktop}
        alt="azzapp-logo"
        width={150}
        className={styles.mobileImageTv}
      />

      <div className={styles.title}>
        {intl.formatMessage({
          defaultMessage: 'Create your email signature from your desktop',
          id: '4G+Bv1',
          description: 'Page for mobile / unsupported signature copy / header',
        })}
      </div>
      <div className={styles.mobileMainDescription}>
        {intl.formatMessage({
          defaultMessage:
            'Your email signature can only be created on a desktop. Please open this link on your computer to set up and enjoy your new signature.',
          id: 'dI92Qd',
          description:
            'Page for mobile / unsupported signature copy / description',
        })}
      </div>
      <div className={styles.separator} />
      <div className={styles.mobileStepDesc}>
        {intl.formatMessage({
          defaultMessage:
            'If you have any questions or need assistance feel free to ',
          id: 'ozPXOV',
          description: 'Page for mobile / unsupported signature copy / footer',
        })}
        <a href="mailto:support@azzapp.com">
          {intl.formatMessage({
            defaultMessage: 'reach out.',
            id: 'VGaIqT',
            description:
              'Page for mobile / unsupported signature copy / reach out with link',
          })}
        </a>

        <div>
          {intl.formatMessage({
            defaultMessage: 'Enjoy using azzapp!',
            id: 'MFZXz8',
            description:
              'Page for mobile / unsupported signature copy / Enjoy Azzapp footer',
          })}
        </div>
      </div>
      <div className={styles.separator} />
    </div>
  );
};

export default CannotCreateEmailSignature;
