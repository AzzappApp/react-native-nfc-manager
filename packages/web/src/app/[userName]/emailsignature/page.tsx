import Image from 'next/image';
import { getMediasByIds, getOwnerProfileByUserName } from '@azzapp/data';
import azzappFull from '#assets/images/azzapp-full.png';
import dlAndroid from '#assets/images/download_android.png';
import dlIos from '#assets/images/download_ios.png';
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

  const media = await (webCard.coverMediaId
    ? getMediasByIds([webCard.coverMediaId]).then(([media]) => media)
    : null);

  const profile = await getOwnerProfileByUserName(userName);

  if (!profile) {
    return notFound();
  }

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <Image
          src={azzappFull}
          alt="azzapp-logo"
          width={150}
          className={styles.image}
        />
        <FullSignature
          webCard={webCard}
          media={media}
          companyLogo={webCard.logoId ?? profile.logoId}
        />
        <Image
          src={azzappFull}
          alt="azzapp-logo"
          width={150}
          className={styles.image}
          style={{ marginTop: '30px', marginBottom: '20px' }}
        />
        <div className={styles.text} style={{ marginBottom: 20 }}>
          Download the mobile app
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Image
            src={dlIos}
            alt="azzapp-logo"
            width={150}
            className={styles.image}
          />
          <Image
            src={dlAndroid}
            alt="azzapp-logo"
            width={150}
            className={styles.image}
          />
        </div>
        <div>©2024 ©azzapp All rights reserved.</div>
      </div>
    </div>
  );
};

export default EmailSignature;

export const dynamicParams = true;
