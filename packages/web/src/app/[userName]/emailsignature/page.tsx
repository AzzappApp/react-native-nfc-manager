import { decompressFromEncodedURIComponent } from 'lz-string';
import { headers } from 'next/headers';
import Image from 'next/image';
import { getMediasByIds, getOwnerProfileByUserName } from '@azzapp/data';
import { verifyHmacWithPassword } from '@azzapp/shared/crypto';
import { parseEmailSignature } from '@azzapp/shared/emailSignatureHelpers';
import azzappFull from '#assets/images/azzapp-full.png';
import { CopyrightFooter } from '#components/CopyrightFooter';
import { getDeviceInfo } from '#helpers/devices';
import { cachedGetWebCardByUserName } from '../dataAccess';
import notFound from '../not-found';
import EmailSignatureGenerator from './EmailSignatureGenerator';
import styles from './page.css';
import StoreLinks from './StoreLinks';

type EmailSignatureProps = {
  params: {
    userName: string;
  };
  searchParams: Record<string, string> | undefined;
};

const EmailSignaturePage = async ({
  params,
  searchParams,
}: EmailSignatureProps) => {
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

  if (!profile || !searchParams) {
    return notFound();
  }

  const mode = searchParams?.['mode'] === 'simple' ? 'simple' : 'full';
  const compressedContactCard = searchParams['e'];

  if (!compressedContactCard) {
    return;
  }
  let contactData: string;
  let signature: string;
  try {
    [contactData, signature] = JSON.parse(
      decompressFromEncodedURIComponent(compressedContactCard),
    );
  } catch {
    return notFound();
  }
  if (!contactData || !signature || !webCard.userName) {
    return notFound();
  }
  const isValid = await verifyHmacWithPassword(
    process.env.CONTACT_CARD_SIGNATURE_SECRET ?? '',
    signature,
    contactData,
    { salt: webCard.userName },
  );
  if (!isValid) {
    return notFound();
  }
  const contact = parseEmailSignature(contactData);

  const showStoreLinks = !isMobileDevice;
  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <Image
          src={azzappFull}
          alt="azzapp-logo"
          width={150}
          style={{ marginBottom: 50 }}
        />
        <EmailSignatureGenerator
          contact={contact}
          mode={mode}
          webCard={webCard}
          media={media}
          companyLogo={
            webCard.isMultiUser && webCard.logoId != null
              ? webCard.logoId
              : profile.logoId
          }
          compressedContactCard={compressedContactCard}
        />

        <Image
          src={azzappFull}
          alt="azzapp-logo"
          width={150}
          style={{ marginTop: 30, marginBottom: 30 }}
        />
        {showStoreLinks && <StoreLinks />}
        <CopyrightFooter />
      </div>
    </div>
  );
};

export default EmailSignaturePage;

export const dynamicParams = true;
