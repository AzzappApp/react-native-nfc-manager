import Image from 'next/image';
import { getMediasByIds } from '@azzapp/data/domains';
import azzappFull from '#assets/images/azzapp-full.png';
import { cachedGetWebCardByUserName } from '../dataAccess';
import notFound from '../not-found';
import FullSignature from './FullEmailSignature';
import styles from './page.css';

type EmailSignatureProps = {
  params: {
    userName: string;
  };
};

const EmailSignature = async ({ params }: EmailSignatureProps) => {
  const userName = params.userName.toLowerCase();
  const webCard = await cachedGetWebCardByUserName(userName);
  if (!webCard) {
    return notFound();
  }

  const media = await (webCard.coverData?.mediaId
    ? getMediasByIds([webCard.coverData.mediaId]).then(([media]) => media)
    : null);

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <Image
          src={azzappFull}
          alt="azzapp-logo"
          width={150}
          className={styles.image}
        />

        <FullSignature webCard={webCard} media={media} />
        <div
          style={{
            alignItems: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className={styles.title}>
            How to add the button to your email signature
          </div>
          <div className={styles.stepText}>STEP 1</div>
          <div className={styles.stepDesc}> Copy the button</div>
          <div className={styles.separator} />
          <div className={styles.stepText}>STEP 2</div>
          <div className={styles.stepDesc}>
            Within your Gmail account, click the gear icon on the top right,
            select the “See all settings” option and scroll down to the
            “Signature” section
          </div>
          <div className={styles.separator} />
          <div className={styles.stepText}>STEP 3</div>
          <div className={styles.stepDesc}>
            Select the “Create new” option and paste your button into the text
            box, or paste the button in an existing signature
          </div>
          <div className={styles.separator} />
          <div className={styles.stepText}>STEP 4</div>
          <div className={styles.stepDesc}>
            In the “Signature Defaults” subsection, select your newly created
            signature as default and then scroll down to the very bottom of the
            page and select the “Save” button
          </div>
          <div className={styles.separator} />
        </div>
      </div>
      <Image
        src={azzappFull}
        alt="azzapp-logo"
        width={150}
        className={styles.image}
      />
    </div>
  );
};

export default EmailSignature;

export const dynamicParams = true;
