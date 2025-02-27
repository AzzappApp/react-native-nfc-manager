'use client';
import Image from 'next/image';
import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { colors } from '@azzapp/shared/colorsHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { getImageURLForSize } from '@azzapp/shared/imagesHelpers';
import { ArrowRightIcon } from '#assets';
import { Button } from '#ui';
import CoverRenderer from '#components/renderer/CoverRenderer';
import TabBar from '#ui/TabBar/TabBar';
import styles from './EmailSignatureGenerator.css';
import renderFullEmailSignature from './renderFullEmailSignature';
import renderSaveMyContactButton from './renderSaveMyContactButton';
import type { Media, WebCard } from '@azzapp/data';
import type { EmailSignatureParsed } from '@azzapp/shared/emailSignatureHelpers';

const EmailSignatureGenerator = ({
  webCard,
  media,
  contact,
  mode,
  companyLogo,
  saveContactURL,
}: {
  webCard: WebCard;
  media: Media | null;
  contact: EmailSignatureParsed;
  mode: 'full' | 'simple';
  companyLogo: string | null;
  saveContactURL: string;
}) => {
  const intl = useIntl();

  const companyLogoUrl = companyLogo
    ? getImageURLForSize({ id: companyLogo, height: 140, format: 'png' })
    : null;

  const saveContactMessage = intl.formatMessage({
    defaultMessage: 'Save my contact',
    id: 'YdhsiU',
    description: 'Signature web link / save my contact',
  });

  const handleCopySignature = async (mode: 'full' | 'simple') => {
    const signature =
      mode === 'full'
        ? renderFullEmailSignature({
            contact,
            webCard,
            companyLogoUrl,
            saveContactMessage,
            saveContactURL,
          })
        : renderSaveMyContactButton({
            primaryColor: webCard.cardColors?.primary ?? colors.black,
            saveContactMessage,
            url: saveContactURL,
          });
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([signature], { type: 'text/html' }),
        'text/plain': new Blob(
          [
            intl.formatMessage({
              defaultMessage:
                "This email client doesn't support rich text signatures",
              description: 'Signature web link / HTML signature not supported',
              id: 'ZvoN2Y',
            }),
          ],
          { type: 'text/plain' },
        ),
      }),
    ]);
  };

  const [activeClient, setActiveClient] = useState('gmail');

  return (
    <>
      <h2 className={styles.title}>
        {mode === 'simple' ? (
          <FormattedMessage
            defaultMessage="Add 'Save my contact' button to your email"
            id="APgNhO"
            description="Signature web link / Simple Mode / add save my contact"
          />
        ) : (
          <FormattedMessage
            defaultMessage="Add this signature to your emails"
            id="uZbSQo"
            description="Signature web link / Normal Mode / add save my contact"
          />
        )}
      </h2>
      {mode === 'simple' ? (
        <div className={styles.pageContainer}>
          <div style={{ width: 200, height: 200 / COVER_RATIO }}>
            <CoverRenderer
              webCard={webCard}
              media={media!}
              priority
              width={200}
            />
          </div>
          <ArrowRightIcon
            color="black"
            height={40}
            width={40}
            className={styles.openIcon}
          />
          <div
            className={styles.simpleContainer}
            style={{ width: 200, height: 200 / COVER_RATIO }}
            dangerouslySetInnerHTML={{
              __html: renderSaveMyContactButton({
                primaryColor: webCard.cardColors?.primary ?? colors.black,
                saveContactMessage,
                url: '#',
              }),
            }}
          />
        </div>
      ) : (
        <div
          style={{
            padding: '15px 20px',
            border: '1px solid #0E1216',
            borderRadius: 20,
          }}
        >
          <div
            dangerouslySetInnerHTML={{
              __html: renderFullEmailSignature({
                contact,
                webCard,
                companyLogoUrl,
                saveContactMessage,
                saveContactURL,
              }),
            }}
          />
        </div>
      )}
      <div
        className={styles.text}
        style={{ marginTop: 50, textAlign: 'center' }}
      >
        {mode === 'simple' ? (
          <FormattedMessage
            defaultMessage="Incorporate this button into your current signature, enabling your recipients to effortlessly save your contact information with just a single click."
            id="Pm7HPS"
            description="Signature web link / description"
          />
        ) : (
          <FormattedMessage
            defaultMessage="Incorporate this signature to your emails, enabling your recipients to effortlessly save your contact information with just a single click."
            id="PmoqJ7"
            description="Signature web link / footer"
          />
        )}
      </div>
      <Button
        onClick={() => handleCopySignature(mode)}
        className={styles.button}
        style={{ marginBottom: 90, marginTop: 50 }}
      >
        {mode === 'simple' ? (
          <FormattedMessage
            defaultMessage="Copy My Button"
            id="bGra2i"
            description="Signature web link / copy button"
          />
        ) : (
          <FormattedMessage
            defaultMessage="Copy my email signature"
            id="TebGlz"
            description="Signature web link / copy signature button"
          />
        )}
      </Button>

      <h3 className={styles.title}>
        {mode === 'simple' ? (
          <FormattedMessage
            defaultMessage="How to add the button to your email signature"
            id="jVfUhp"
            description="Signature web link / Simple Mode / how to"
          />
        ) : (
          <FormattedMessage
            defaultMessage="How to add the signature to your email signature"
            id="FaebJ9"
            description="Signature web link / Normal Mode / how to"
          />
        )}
      </h3>
      <TabBar
        activeTab={activeClient}
        onTabChange={setActiveClient}
        className={styles.tabBar}
        tabs={[
          {
            id: 'gmail',
            icon: (
              <Image
                src={require('./assets/gmail.png')}
                alt="Gmail"
                width={24}
              />
            ),
            title: intl.formatMessage({
              defaultMessage: 'Gmail',
              id: '/pG0Jf',
              description: 'Signature web link / Gmail tab',
            }),
          },
          {
            id: 'outlook',
            icon: (
              <Image
                src={require('./assets/outlook.png')}
                alt="Outlook"
                width={24}
              />
            ),
            title: intl.formatMessage({
              defaultMessage: 'Outlook',
              id: 'zI4GFW',
              description: 'Signature web link / Outlook tab',
            }),
          },
          {
            id: 'apple',
            icon: (
              <Image
                src={require('./assets/apple-mail.png')}
                alt="Apple"
                width={24}
              />
            ),
            title: intl.formatMessage({
              defaultMessage: 'Apple Mail',
              id: '0oi0ho',
              description: 'Signature web link / Apple tab',
            }),
          },
        ]}
      />
    </>
  );
};

export default EmailSignatureGenerator;
