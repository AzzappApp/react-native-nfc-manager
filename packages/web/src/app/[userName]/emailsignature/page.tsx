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
        <Image
          src={azzappFull}
          alt="azzapp-logo"
          width={150}
          className={styles.image}
        />
      </div>
    </div>
  );
};

export default EmailSignature;

export const dynamicParams = true;
