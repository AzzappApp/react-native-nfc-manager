import { decompressFromEncodedURIComponent } from 'lz-string';
import { headers } from 'next/headers';
import Image from 'next/image';
import {
  getContactCardAccessById,
  getMediasByIds,
  getProfileById,
  getUserById,
} from '@azzapp/data';
import { DEFAULT_LOCALE, isSupportedLocale } from '@azzapp/i18n';
import { verifyHmacWithPassword } from '@azzapp/shared/crypto';
import { parseEmailSignature } from '@azzapp/shared/emailSignatureHelpers';
import { getImageURLForSize } from '@azzapp/shared/imagesHelpers';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import {
  buildUserUrlWithContactCard,
  buildUserUrlWithKey,
} from '@azzapp/shared/urlHelpers';
import azzappFull from '#assets/images/azzapp-full.png';
import { CopyrightFooter } from '#components/CopyrightFooter';
import { getDeviceInfo } from '#helpers/devices';
import { getServerIntl } from '#helpers/i18nHelpers';
import { cachedGetWebCardByUserName } from '../dataAccess';
import notFound from '../not-found';
import CopySignatureButton from './CopySignatureButton';
import EmailSignaturePreview from './EmailSignaturePreview';
import styles from './page.css';
import SignatureNotice from './SignatureNotice';
import StoreLinks from './StoreLinks';

type EmailSignatureProps = {
  params: Promise<{
    userName: string;
  }>;
  searchParams: Promise<any> | undefined;
};

const EmailSignaturePage = async (props: EmailSignatureProps) => {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { isMobileDevice } = getDeviceInfo((await headers()).get('user-agent'));

  const webCard = await cachedGetWebCardByUserName(params.userName);
  if (!webCard || !webCard.userName || webCard.deleted) {
    return notFound();
  }

  const media = await (webCard.coverMediaId
    ? getMediasByIds([webCard.coverMediaId]).then(([media]) => media)
    : null);

  if (!searchParams) {
    return notFound();
  }

  const mode = searchParams?.['mode'] === 'simple' ? 'simple' : 'full';

  const compressedKey = searchParams['k'];

  let saveContactURL;
  let profile;

  if (compressedKey) {
    const [serialized, signature] = JSON.parse(
      decompressFromEncodedURIComponent(compressedKey),
    );

    const isValid = await verifyHmacWithPassword(
      process.env.CONTACT_CARD_SIGNATURE_SECRET ?? '',
      signature,
      serialized,
      { salt: webCard.userName },
    );
    if (!isValid) {
      return notFound();
    }

    const [contactCardAccessId, key] = JSON.parse(serialized);

    const contactAccess = await getContactCardAccessById(contactCardAccessId);

    if (!contactAccess || contactAccess.isRevoked) {
      return notFound();
    }

    profile = await getProfileById(contactAccess.profileId);

    if (!profile || profile.webCardId !== webCard.id) {
      return notFound();
    }

    saveContactURL = buildUserUrlWithKey({
      userName: webCard.userName,
      key,
      contactCardAccessId,
    });
  } else {
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
    if (!contactData || !signature) {
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
    profile = await getProfileById(contact.profileId);

    if (!profile || profile.webCardId !== webCard.id) {
      return notFound();
    }

    const { data: saveContactData, signature: saveContactSignature } =
      await serializeAndSignContactCard(
        webCard.userName,
        profile.id,
        profile.webCardId,
        profile.contactCard ?? {},
        webCard.isMultiUser ? webCard?.commonInformation : null,
      );

    saveContactURL = buildUserUrlWithContactCard(
      webCard.userName,
      saveContactData,
      saveContactSignature,
    );
  }

  const user = await getUserById(profile.userId);
  if (!user) {
    return notFound();
  }

  const companyLogo =
    webCard.isMultiUser && webCard.logoId != null
      ? webCard.logoId
      : profile.logoId;
  let companyLogoUrl: string | null = null;
  if (companyLogo) {
    const [companyLogoMedia] = await getMediasByIds([companyLogo]);
    if (companyLogoMedia) {
      companyLogoUrl = getImageURLForSize({
        id: companyLogo,
        width: (companyLogoMedia.width / companyLogoMedia.height) * 120,
        format: 'png',
      });
    }
  }

  const showStoreLinks = !isMobileDevice;

  const intl = getServerIntl(
    isSupportedLocale(user.locale) ? user.locale : DEFAULT_LOCALE,
  );
  const saveContactMessage = intl.formatMessage({
    defaultMessage: 'Save my contact',
    id: 'YdhsiU',
    description: 'Signature web link / save my contact',
  });

  const bannerId =
    webCard.isMultiUser && webCard.bannerId != null
      ? webCard.bannerId
      : profile.bannerId;

  const bannerUrl = bannerId
    ? getImageURLForSize({
        id: bannerId,
        width: 1200,
      })
    : null;

  return (
    <div className={styles.container}>
      <Image
        src={azzappFull}
        alt="azzapp-logo"
        width={150}
        className={styles.logo}
      />
      <h2 className={styles.title}>
        {mode === 'simple'
          ? intl.formatMessage({
              defaultMessage: "Add 'Save my contact' button to your email",
              id: 'APgNhO',
              description:
                'Signature web link / Simple Mode / add save my contact',
            })
          : intl.formatMessage({
              defaultMessage: 'Add this signature to your emails',
              id: 'uZbSQo',
              description:
                'Signature web link / Normal Mode / add save my contact',
            })}
      </h2>
      <EmailSignaturePreview
        mode={mode}
        webCard={webCard}
        media={media}
        profile={profile}
        companyLogoUrl={companyLogoUrl}
        bannerUrl={bannerUrl}
        saveContactMessage={saveContactMessage}
        saveContactURL={saveContactURL}
      />
      <p className={styles.description}>
        {mode === 'simple'
          ? intl.formatMessage({
              defaultMessage:
                'Incorporate this button into your current signature, enabling your recipients to effortlessly save your contact information with just a single click.',
              id: 'Pm7HPS',
              description: 'Signature web link / description',
            })
          : intl.formatMessage({
              defaultMessage:
                'Incorporate this signature to your emails, enabling your recipients to effortlessly save your contact information with just a single click.',
              id: 'PmoqJ7',
              description: 'Signature web link / footer',
            })}
      </p>
      <CopySignatureButton
        mode={mode}
        companyLogoUrl={companyLogoUrl}
        profile={profile}
        saveContactMessage={saveContactMessage}
        bannerUrl={bannerUrl}
        saveContactURL={saveContactURL}
        webCard={webCard}
      />
      <h3 className={styles.title}>
        {mode === 'simple'
          ? intl.formatMessage({
              defaultMessage: 'How to add the button to your email signature',
              id: 'jVfUhp',
              description: 'Signature web link / Simple Mode / how to',
            })
          : intl.formatMessage({
              defaultMessage:
                'How to add the signature to your email signature',
              id: 'FaebJ9',
              description: 'Signature web link / Normal Mode / how to',
            })}
      </h3>
      <SignatureNotice />
      <Image
        src={azzappFull}
        alt="azzapp-logo"
        width={150}
        style={{ marginTop: 30, marginBottom: 30 }}
      />
      {showStoreLinks && <StoreLinks />}
      <CopyrightFooter />
    </div>
  );
};

export default EmailSignaturePage;

export const dynamicParams = true;
