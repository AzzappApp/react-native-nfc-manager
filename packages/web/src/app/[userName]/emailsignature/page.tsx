import { headers } from 'next/headers';
import Image from 'next/image';
import { getMediasByIds, getOwnerProfileByUserName } from '@azzapp/data';
import azzappFull from '#assets/images/azzapp-full.png';
import dlAndroid from '#assets/images/download_android.png';
import dlIos from '#assets/images/download_ios.png';
import { CopyrightFooter } from '#components/CopyrightFooter';
import { getDeviceInfo } from '#helpers/devices';
import { cachedGetWebCardByUserName } from '../dataAccess';
import notFound from '../not-found';
import CannotCreateEmailSignature from './CannotCreateEmailSignature';
import FullSignature from './FullEmailSignature';
import styles from './page.css';

type EmailSignatureProps = {
  params: {
    userName: string;
  };
};

const EmailSignature = async ({ params }: EmailSignatureProps) => {
  const { isMobileDevice } = getDeviceInfo(headers().get('user-agent'));
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

  const showStoreLinks = !isMobileDevice;
  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <Image
          src={azzappFull}
          alt="azzapp-logo"
          width={150}
          className={styles.image}
        />
        {isMobileDevice ? (
          <CannotCreateEmailSignature />
        ) : (
          <FullSignature
            webCard={webCard}
            media={media}
            companyLogo={
              webCard.isMultiUser && webCard.logoId != null
                ? webCard.logoId
                : profile.logoId
            }
          />
        )}

        <Image
          src={azzappFull}
          alt="azzapp-logo"
          width={150}
          className={styles.image}
          style={{ marginTop: '30px', marginBottom: '20px' }}
        />

        {showStoreLinks ? (
          <>
            <div className={styles.text} style={{ marginBottom: 20 }}>
              Download the mobile app
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a
                href="https://apps.apple.com/app/id6502694267"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={dlIos}
                  alt="azzapp-logo"
                  width={150}
                  className={styles.image}
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.azzapp.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={dlAndroid}
                  alt="azzapp-logo"
                  width={150}
                  className={styles.image}
                />
              </a>
            </div>
          </>
        ) : undefined}

        <CopyrightFooter />
      </div>
    </div>
  );
};

export default EmailSignature;

export const dynamicParams = true;
