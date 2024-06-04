'use client';
import { decompressFromEncodedURIComponent } from 'lz-string';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { colors, getTextColor } from '@azzapp/shared/colorsHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { parseEmailSignature } from '@azzapp/shared/emailSignatureHelpers';
import { getImageURLForSize } from '@azzapp/shared/imagesHelpers';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import mailLogo from '@azzapp/web/public/signature/mail.png';
import phoneLogo from '@azzapp/web/public/signature/phone.png';
import { ArrowRightIcon } from '#assets';
import { Button } from '#ui';
import CoverRenderer from '#components/renderer/CoverRenderer';
import notFound from '../not-found';
import styles from './page.css';
import type { Media, WebCard } from '@azzapp/data';
import type { EmailSignatureParsed } from '@azzapp/shared/emailSignatureHelpers';

const FullEmailSignature = ({
  webCard,
  media,
  companyLogo,
}: {
  webCard: WebCard;
  media: Media | null;
  companyLogo: string | null;
}) => {
  const searchParams = useSearchParams();
  const [contact, setContact] = useState<EmailSignatureParsed | undefined>();
  const [coverWidth, setCoverWidth] = useState(0);
  useEffect(() => {
    const handleResize = () => {
      setCoverWidth(Math.min(200, (window.innerWidth * 35) / 100));
    };

    if (document.readyState === 'complete') {
      handleResize();
    }

    window.addEventListener('load', handleResize, false);
    window.addEventListener('resize', handleResize, false);

    return () => {
      window.removeEventListener('load', handleResize, false);
      window.removeEventListener('resize', handleResize, false);
    };
  }, []);

  const mode = searchParams.get('mode');
  useEffect(() => {
    const compressedContactCard = searchParams.get('e');

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
      return;
    }

    try {
      if (contactData && signature) {
        fetch('/api/verifySign', {
          body: JSON.stringify({
            signature,
            data: contactData,
            salt: webCard.userName,
          }),
          method: 'POST',
        })
          .then(() => {
            setContact(parseEmailSignature(contactData));
          })
          .catch(error => {
            console.log('error', error);
            return notFound();
          });
      }
    } catch (error) {
      console.log(error);
    }
  }, [searchParams, webCard.userName]);

  const companyLogoUrl = companyLogo
    ? getImageURLForSize({ id: companyLogo, height: 140, extension: 'png' })
    : null;
  const handleCopySignature = async (mode: 'full' | 'simple') => {
    const compressedContactCard = searchParams.get('c') ?? '';
    const url =
      mode === 'full'
        ? buildCardSignature(
            buildUserUrl(webCard.userName) + '?c=' + compressedContactCard,
            contact?.avatar,
            formatDisplayName(contact?.firstName, contact?.lastName),
            contact?.title,
            contact?.company,
            contact?.phoneNumbers,
            contact?.emails,
            companyLogoUrl,
            webCard.cardColors?.primary ?? colors.white,
            getTextColor(webCard.cardColors?.primary ?? colors.white),
          )
        : buildSaveMyContactSignature(
            buildUserUrl(webCard.userName) + '?c=' + compressedContactCard,
          );

    const type = 'text/html';
    const blob = new Blob([url], { type });
    const data = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.write(data);
  };

  if (mode === 'simple') {
    return (
      <React.Fragment>
        <div className={styles.title}>
          Add “Save my contact” button to your email
        </div>
        <div className={styles.pageContainer}>
          <div style={{ width: coverWidth, height: coverWidth / COVER_RATIO }}>
            <CoverRenderer
              webCard={webCard}
              media={media!}
              priority
              width={coverWidth}
            />
          </div>
          <ArrowRightIcon
            color="black"
            height={40}
            width={40}
            className={styles.openIcon}
          />
          <div
            className={styles.simpleContainer}
            style={{ width: coverWidth, height: coverWidth / COVER_RATIO }}
          >
            <div className={styles.simpleButton}>Save my contact</div>
          </div>
        </div>
        <div
          className={styles.text}
          style={{ marginTop: 50, textAlign: 'center' }}
        >
          Incorporate this button into your current signature, enabling your
          recipients to effortlessly save your contact information with just a
          single click.
        </div>
        <Button
          onClick={() => handleCopySignature('simple')}
          className={styles.button}
          style={{ marginBottom: 90, marginTop: 50 }}
        >
          Copy My Button
        </Button>
        {mode && <CommonExplanation mode={mode!} />}
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <div className={styles.title}>
        {mode === 'simple '
          ? `Add "Save my contact" button to your email`
          : `Add this signature to your emails`}
      </div>
      <table
        border={0}
        cellPadding={0}
        cellSpacing="0"
        width="100%"
        className={styles.tableFull}
      >
        <tbody>
          {contact?.avatar && (
            <tr>
              <td height="60px" valign="top" colSpan={2}>
                <img
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '30px',
                    marginBottom: '20px',
                  }}
                  src={contact?.avatar}
                />
              </td>
            </tr>
          )}
          <tr>
            <td height="100%" valign="top" width="100%">
              <div>
                <div>
                  <div
                    style={{
                      textAlign: 'left',
                      color: 'black',
                      fontSize: '16px',
                      fontFamily: 'Helvetica Neue',
                      fontWeight: 500,
                      lineHeight: '20px',
                      marginBottom: '5px',
                    }}
                  >
                    {formatDisplayName(contact?.firstName, contact?.lastName)}
                  </div>

                  {contact?.title && (
                    <div
                      style={{
                        textAlign: 'left',
                        fontSize: '14px',
                        fontFamily: 'Helvetica Neue',
                        fontWeight: 500,
                        lineHeight: '18px',
                        marginBottom: '5px',
                        color: webCard.cardColors?.primary ?? colors.black,
                      }}
                    >
                      {contact.title}
                    </div>
                  )}
                  {contact?.company && (
                    <div
                      style={{
                        textAlign: 'left',
                        color: '#87878E',
                        fontSize: '12px',
                        fontFamily: 'Helvetica Neue',
                        fontWeight: 400,
                        marginBottom: '5px',
                      }}
                    >
                      {contact.company}
                    </div>
                  )}
                </div>
              </div>
              <table
                className={styles.tableButton}
                style={{
                  backgroundColor: webCard.cardColors?.primary ?? colors.white,
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontFamily: 'Helvetica Neue',
                        fontWeight: 700,
                        color: getTextColor(
                          webCard.cardColors?.primary ?? colors.white,
                        ),
                      }}
                    >
                      Save my contact
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td
              valign="top"
              style={{
                width: '50%',
                paddingLeft: '30px',
                borderLeft: '1px solid  #E2E1E3',
              }}
            >
              {contact?.phoneNumbers &&
                contact?.phoneNumbers.length > 0 &&
                contact?.phoneNumbers.map(phone => {
                  return (
                    <div
                      key={phone}
                      style={{
                        height: '20px',
                        width: '100%',
                        display: 'inline-block',
                      }}
                    >
                      <Image
                        src={phoneLogo}
                        style={{
                          width: '14px',
                          height: '14px',
                          verticalAlign: 'middle',
                        }}
                        alt={'maillogo'}
                      />
                      <span
                        style={{
                          fontFamily: 'Helvetica Neue',
                          fontSize: '12px',
                          fontWeight: 400,
                          textAlign: 'center',
                          marginLeft: '4px',
                        }}
                      >
                        {phone}
                      </span>
                    </div>
                  );
                })}

              {contact?.emails &&
                contact?.emails.length > 0 &&
                contact?.emails.map(mail => {
                  return (
                    <div
                      key={mail}
                      style={{
                        height: '20px',
                        width: '100%',
                        display: 'inline-block',
                      }}
                    >
                      <Image
                        src={mailLogo}
                        style={{
                          width: '14px',
                          height: '14px',
                          verticalAlign: 'middle',
                        }}
                        alt={'phonelogo'}
                      />
                      <span
                        style={{
                          fontFamily: 'Helvetica Neue',
                          fontSize: '12px',
                          fontWeight: 400,
                          textAlign: 'center',
                          marginLeft: '4px',
                        }}
                      >
                        {mail}
                      </span>
                    </div>
                  );
                })}
              {companyLogoUrl && (
                <img
                  style={{
                    marginTop: '15px',
                    height: '60px',
                    objectFit: 'contain',
                  }}
                  src={companyLogoUrl}
                />
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <div
        className={styles.text}
        style={{ marginTop: 50, textAlign: 'center' }}
      >
        Incorporate this signature to your emails, enabling your recipients to
        effortlessly save your contact information with just a single click.
      </div>
      <Button
        onClick={() => handleCopySignature('full')}
        className={styles.button}
        style={{ marginBottom: 90, marginTop: 50 }}
      >
        Copy my email signature
      </Button>
      {mode && <CommonExplanation mode={mode!} />}
    </React.Fragment>
  );
};

const CommonExplanation = ({ mode }: { mode: string }) => {
  return (
    <div
      style={{
        alignItems: 'flex-start',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 16,
        marginRight: 16,
      }}
    >
      <div className={styles.title}>
        {mode === 'simple'
          ? 'How to add the button to your email signature'
          : 'How to add the signature to your email signature'}
      </div>
      <div className={styles.stepText}>STEP 1</div>
      <div className={styles.stepDesc}>
        {mode === 'simple' ? 'Copy the button' : 'Copy the signature'}
      </div>
      <div className={styles.separator} />
      <div className={styles.stepText}>STEP 2</div>
      <div className={styles.stepDesc}>
        Within your Gmail account, click the gear icon on the top right, select
        the “See all settings” option and scroll down to the “Signature” section
      </div>
      <div className={styles.separator} />
      <div className={styles.stepText}>STEP 3</div>
      <div className={styles.stepDesc}>
        {mode === 'simple'
          ? `Select the “Create new” option and paste your button into the text
            box, or paste the button in an existing signature`
          : `Select the “Create new” option and paste your signature into the text box.`}
      </div>
      <div className={styles.separator} />
      <div className={styles.stepText}>STEP 4</div>
      <div className={styles.stepDesc}>
        In the “Signature Defaults” subsection, select your newly created
        signature as default and then scroll down to the very bottom of the page
        and select the “Save” button
      </div>
      <div className={styles.separator} />
    </div>
  );
};

export default FullEmailSignature;

export function buildCardSignature(
  url: string,
  avatarUrl: string | null | undefined,
  displayName: string | null | undefined,
  title: string | null | undefined,
  company: string | null | undefined,
  phones: string[] | null | undefined,
  mails: string[] | null | undefined,
  companyLogo: string | null | undefined,
  primaryColor: string,
  readableColor: string,
) {
  let card = `
  <table  border="0" cellpadding="0" cellspacing="0" 
    style="table-layout: fixed;max-width:  500px; text-decoration: unset !important; width:100%;">
    <tbody>`;
  if (avatarUrl) {
    card += `<tr>
              <td height="60px" valign="top" colspan="2">
                <img style="width: 60px; height: 60px; border-radius: 30px; margin-bottom: 20px;"  src="${avatarUrl}" />
              </td>
            </tr>`;
  }
  card += `<tr style="max-width: 100% !important">
            <td height="100%" valign="top" style="width:100% !important; flex-direction:column; justify-content:space-evenly">
           <div style="height: 100%">`;
  if (displayName) {
    card += `<div style="text-align: left; color: black; font-size: 16px; font-family: Helvetica Neue; font-weight: 500 !important; word-wrap: break-word; line-height: 20px; margin-bottom:5px">${displayName}</div>`;
  }
  if (title) {
    card += `<div style="text-align: left; color: black; font-size: 14px; font-family: Helvetica Neue; font-weight: 500; word-wrap: break-word; color: ${primaryColor};line-height: 18px; margin-bottom:5px">${title}</div>`;
  }
  if (company) {
    card += ` <div style="text-align: left; color: black; font-size: 12px; font-family: Helvetica Neue; font-weight: 400; word-wrap: break-word; color : #87878E; margin-bottom:5px">${company}</div>`;
  }
  card += `</div>`;
  card += `<a href="${url}" rel=“noopener” noreferrer target=“_blank”  style="text-decoration: unset !important;">
            <table style="background-color: ${primaryColor};height:34px;width:125px;padding-left: 10px;padding-right: 10px;border-radius:48px;font-size:12px;margin-top:12px">
            <tbody> 
              <tr>
                <td style="vertical-align: middle; text-align: center;color: ${readableColor}; font-size: 12px; font-family: Helvetica; font-weight: 700">
                  Save my contact
                </td>
              </tr>
            </tbody>
          </table>
          </a>
        </td>
   <td  height="100%" valign="top" style="width:100% !important; padding-left: 30px; border-left: 1px solid  #E2E1E3">`;

  if (phones) {
    for (let index = 0; index < phones.length; index++) {
      card += `<div style="height:20px; width:100%; display:inline-block; vertical-align: middle;">
                  <img src="${process.env.NEXT_PUBLIC_URL}${phoneLogo.src}"  style="width: 14px; height: 14px;vertical-align: middle"/>
                   <a href="tel:${phones[index]}" rel=“noopener” noreferrer target=“_blank”  style="text-decoration: unset !important;color:black;font-size: 12px;font-weight:400px; color: black">
                    ${phones[index]}
                  </span>
              </div>`;
    }
  }
  if (mails) {
    for (let index = 0; index < mails.length; index++) {
      card += `<div style="height:20px; width:100%; display:inline-block; vertical-align: middle;">
                  <img src="${process.env.NEXT_PUBLIC_URL}${mailLogo.src}"  style="width: 14px; height: 14px;vertical-align: middle"/>
                   <a href="mailto:${mails[index]}" rel=“noopener” noreferrer target=“_blank”  style="text-decoration: unset !important;color:black;font-size: 12px;font-weight:400px; color: black">
                    ${mails[index]}
                    </a>
              </div>`;
    }
  }
  if (companyLogo) {
    card += `<a href="${url}" rel=“noopener” noreferrer target=“_blank”  style="text-decoration: unset !important;">
      <img style="margin-top:15px; height: 60px; object-fit: contain;" src="${companyLogo}" />
    </a>`;
  }
  card += `</td>
      </tr>
    </tbody>
  </table>`;
  return card;
}

export function buildSaveMyContactSignature(url: string) {
  return `
  <a href="${url}" rel=“noopener” noreferrer target=“_blank” style="text-decoration: unset !important; color: black;padding-left: 30px;padding-right: 30px">
    <table style="border: 1px solid black;height:34px;padding-left: 10px;padding-right: 10px;border-radius:48px;box-shadow:0px 4px 16px 0px rgba(0, 0, 0, 0.25);font-size:12px;border: 1px solid black;text-decoration: unset !important">
      <tr>
        <td style="vertical-align: middle; text-align: center;text-decoration: unset !important">
          Save my contact
        </td>
      </tr>
    </table>
  </a>`;
}
