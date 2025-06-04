'use client';

import { FormattedMessage, useIntl } from 'react-intl';
import { Button } from '#ui';
import styles from './CopySignatureButton.css';
import renderFullEmailSignature from './renderFullEmailSignature';
import renderSaveMyContactButton from './renderSaveMyContactButton';
import type { Profile, WebCard } from '@azzapp/data';

type CopySignatureButtonProps = {
  mode: 'full' | 'simple';
  profile: Profile;
  webCard: WebCard;
  companyLogoUrl: string | null;
  bannerUrl: string | null;
  saveContactMessage: string;
  saveContactURL: string;
};

const CopySignatureButton = ({
  mode,
  profile,
  webCard,
  companyLogoUrl,
  bannerUrl,
  saveContactMessage,
  saveContactURL,
}: CopySignatureButtonProps) => {
  const intl = useIntl();

  const handleCopySignature = async () => {
    const signature =
      mode === 'full'
        ? renderFullEmailSignature({
            profile,
            webCard,
            companyLogoUrl,
            bannerUrl,
            saveContactMessage,
            saveContactURL,
          })
        : renderSaveMyContactButton({
            primaryColor: '#000',
            saveContactMessage,
            saveContactURL,
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

  return (
    <Button onClick={handleCopySignature} className={styles.button}>
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
  );
};

export default CopySignatureButton;
