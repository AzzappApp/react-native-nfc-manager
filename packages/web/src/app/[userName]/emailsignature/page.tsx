import { decompressFromEncodedURIComponent } from 'lz-string';
import { headers } from 'next/headers';
import Image from 'next/image';
import { getMediasByIds, getProfileById, getUserById } from '@azzapp/data';
import { DEFAULT_LOCALE, isSupportedLocale } from '@azzapp/i18n';
import { verifyHmacWithPassword } from '@azzapp/shared/crypto';
import { parseEmailSignature } from '@azzapp/shared/emailSignatureHelpers';
import {
  getImageURLForSize,
  getRoundImageURLForSize,
} from '@azzapp/shared/imagesHelpers';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import { buildUserUrlWithContactCard } from '@azzapp/shared/urlHelpers';
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

  const webCard = await cachedGetWebCardByUserName(params.userName);
  if (!webCard) {
    return notFound();
  }

  const media = await (webCard.coverMediaId
    ? getMediasByIds([webCard.coverMediaId]).then(([media]) => media)
    : null);

  if (!searchParams) {
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
  const profile = await getProfileById(contact.profileId);

  if (!profile || profile.webCardId !== webCard.id) {
    return notFound();
  }

  const user = await getUserById(profile.userId);
  if (!user) {
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

  const companyLogo =
    webCard.isMultiUser && webCard.logoId != null
      ? webCard.logoId
      : profile.logoId;
  const companyLogoUrl = companyLogo
    ? getImageURLForSize({ id: companyLogo, height: 120, format: 'png' })
    : null;

  const saveContactURL = buildUserUrlWithContactCard(
    webCard.userName,
    saveContactData,
    saveContactSignature,
  );

  const showStoreLinks = !isMobileDevice;

  const intl = getServerIntl(
    isSupportedLocale(user.locale) ? user.locale : DEFAULT_LOCALE,
  );
  const saveContactMessage = intl.formatMessage({
    defaultMessage: 'Save my contact',
    id: 'YdhsiU',
    description: 'Signature web link / save my contact',
  });

  // we override the avatar with the one from the profile if it exists
  // to transform it into a round image
  if (contact.avatar && profile.avatarId) {
    contact.avatar = getRoundImageURLForSize({
      id: profile.avatarId,
      height: 120,
      width: 120,
      format: 'png',
    });
  }

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
        contact={contact}
        companyLogoUrl={companyLogoUrl}
        saveContactMessage={saveContactMessage}
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
        contact={contact}
        saveContactMessage={saveContactMessage}
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
