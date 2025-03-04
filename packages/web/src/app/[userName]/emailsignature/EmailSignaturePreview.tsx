import { colors } from '@azzapp/shared/colorsHelpers';
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
  saveContactMessage: string;
};

const EmailSignaturePreview = ({
  mode,
  webCard,
  media,
  contact,
  companyLogoUrl,
  saveContactMessage,
}: EmailSignaturePreviewProps) => {
  return mode === 'simple' ? (
    <section className={styles.simpleSignaturePreviewContainer}>
      <div className={styles.coverContainer}>
        <CoverRenderer
          webCard={webCard}
          media={media!}
          priority
          width={200}
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
            primaryColor: webCard.cardColors?.primary ?? colors.black,
            saveContactMessage,
            saveContactURL: '#',
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
            saveContactMessage,
            saveContactURL: '#',
          }),
        }}
      />
    </section>
  );
};

export default EmailSignaturePreview;
