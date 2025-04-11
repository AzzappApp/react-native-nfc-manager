import { ArrowRightIcon } from '#assets';
import CoverRenderer from '#components/renderer/CoverRenderer';
import styles from './EmailSignaturePreview.css';
import renderFullEmailSignature from './renderFullEmailSignature';
import renderSaveMyContactButton from './renderSaveMyContactButton';
import type { Media, WebCard } from '@azzapp/data';
import type { EmailSignatureParsed } from '@azzapp/shared/emailSignatureHelpers';

type EmailSignaturePreviewProps = {
  mode: 'full' | 'simple';
  webCard: WebCard;
  media: Media | null;
  contact: EmailSignatureParsed;
  companyLogoUrl: string | null;
  bannerUrl: string | null;
  saveContactMessage: string;
  saveContactURL: string;
};

const COVER_WIDTH = 198;
const COVER_RADIUS = `${(35 / 300) * COVER_WIDTH}px`;

const EmailSignaturePreview = ({
  mode,
  webCard,
  media,
  contact,
  companyLogoUrl,
  bannerUrl,
  saveContactMessage,
  saveContactURL,
}: EmailSignaturePreviewProps) => {
  return mode === 'simple' ? (
    <section className={styles.simpleSignaturePreviewContainer}>
      <div
        className={styles.coverContainer}
        style={{ borderRadius: COVER_RADIUS }}
      >
        <CoverRenderer
          webCard={webCard}
          media={media!}
          priority
          width={COVER_WIDTH}
          staticCover
        />
      </div>
      <ArrowRightIcon
        color="black"
        height={40}
        width={40}
        className={styles.openIcon}
      />
      <div
        className={styles.simpleSignatureContainer}
        dangerouslySetInnerHTML={{
          __html: renderSaveMyContactButton({
            primaryColor: '#000',
            saveContactMessage,
            saveContactURL,
          }),
        }}
      />
    </section>
  ) : (
    <section className={styles.fullSignatureContainer}>
      <div
        dangerouslySetInnerHTML={{
          __html: renderFullEmailSignature({
            contact,
            webCard,
            companyLogoUrl,
            bannerUrl,
            saveContactMessage,
            saveContactURL,
            isPreview: true,
          }),
        }}
      />
    </section>
  );
};

export default EmailSignaturePreview;
