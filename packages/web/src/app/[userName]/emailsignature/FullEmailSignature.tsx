'use client';
import { decompressFromEncodedURIComponent } from 'lz-string';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { colors, getTextColor } from '@azzapp/shared/colorsHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { parseEmailSignature } from '@azzapp/shared/emailSignatureHelpers';
import { getImageURLForSize } from '@azzapp/shared/imagesHelpers';
import {
  formatDisplayName,
  formatPhoneNumberUri,
} from '@azzapp/shared/stringHelpers';
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
  const intl = useIntl();
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
    ? getImageURLForSize({ id: companyLogo, height: 140, format: 'png' })
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
          {intl.formatMessage({
            defaultMessage: 'Add “Save my contact” button to your email',
            id: 'BadFyG',
            description: 'Signature web link / title',
          })}
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
          {intl.formatMessage({
            defaultMessage:
              'Incorporate this button into your current signature, enabling your recipients to effortlessly save your contact information with just a single click.',
            id: 'Pm7HPS',
            description: 'Signature web link / description',
          })}
        </div>
        <Button
          onClick={() => handleCopySignature('simple')}
          className={styles.button}
          style={{ marginBottom: 90, marginTop: 50 }}
        >
          {intl.formatMessage({
            defaultMessage: 'Copy My Button',
            id: 'bGra2i',
            description: 'Signature web link / copy button',
          })}
        </Button>
        {mode && <CommonExplanation mode={mode!} />}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className={styles.title}>
        {mode === 'simple '
          ? intl.formatMessage({
              defaultMessage: `Add "Save my contact" button to your email`,
              id: 'x5GviQ',
              description:
                'Signature web link / Simple Mode / add save my contact',
            })
          : intl.formatMessage({
              defaultMessage: `Add this signature to your emails`,
              id: 'uZbSQo',
              description:
                'Signature web link / Normal Mode / add save my contact',
            })}
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
            <td height="100%" valign="top" width="50%">
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
                      {intl.formatMessage({
                        defaultMessage: 'Save my contact',
                        id: 'YdhsiU',
                        description: 'Signature web link / save my contact',
                      })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td
              valign="top"
              style={{
                width: '50%',
                paddingLeft: '15px',
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
                        alt="maillogo"
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
                        alt="phonelogo"
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
        {intl.formatMessage({
          defaultMessage:
            'Incorporate this signature to your emails, enabling your recipients to effortlessly save your contact information with just a single click.',
          id: 'PmoqJ7',
          description: 'Signature web link / footer',
        })}
      </div>
      <Button
        onClick={() => handleCopySignature('full')}
        className={styles.button}
        style={{ marginBottom: 90, marginTop: 50 }}
      >
        {intl.formatMessage({
          defaultMessage: 'Copy my email signature',
          id: 'TebGlz',
          description: 'Signature web link / copy signature button',
        })}
      </Button>
      {mode && <CommonExplanation mode={mode!} />}
    </React.Fragment>
  );
};

const CommonExplanation = ({ mode }: { mode: string }) => {
  const intl = useIntl();
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
          ? intl.formatMessage({
              defaultMessage: 'How to add the button to your email signature',
              id: 'bOv1NW',
              description:
                'Signature web link / simple explanation / description header',
            })
          : intl.formatMessage({
              defaultMessage:
                'How to add the signature to your email signature',
              id: 'd/BVbO',
              description:
                'Signature web link / normal explanation / description header',
            })}
      </div>
      <div className={styles.stepText}>
        {intl.formatMessage({
          defaultMessage: 'STEP 1',
          id: 'r7RTwK',
          description: 'Signature web link / explanation / description step 1',
        })}
      </div>
      <div className={styles.stepDesc}>
        {mode === 'simple'
          ? intl.formatMessage({
              defaultMessage: 'Copy the button',
              id: 'GcLC3e',
              description:
                'Signature web link / simple explanation / description step 1 details',
            })
          : intl.formatMessage({
              defaultMessage: 'Copy the signature',
              id: 'YJ9lYH',
              description:
                'Signature web link / normal explanation / description step 1 details',
            })}
      </div>
      <div className={styles.separator} />
      <div className={styles.stepText}>
        {intl.formatMessage({
          defaultMessage: 'STEP 2',
          id: 'BqY1R+',
          description: 'Signature web link / explanation / description step 2',
        })}
      </div>
      <div className={styles.stepDesc}>
        {intl.formatMessage({
          defaultMessage:
            'Within your Gmail account, click the gear icon on the top right, select the “See all settings” option and scroll down to the “Signature” section',
          id: '0NaUVp',
          description:
            'Signature web link / explanation / description step 2 details',
        })}
      </div>
      <div className={styles.separator} />
      <div className={styles.stepText}>
        {intl.formatMessage({
          defaultMessage: 'STEP 3',
          id: 'c3TCgL',
          description: 'Signature web link / explanation / description step 3',
        })}
      </div>
      <div className={styles.stepDesc}>
        {mode === 'simple'
          ? intl.formatMessage({
              defaultMessage: `Select the “Create new” option and paste your button into the text box, or paste the button in an existing signature`,
              id: 'TX89WF',
              description:
                'Signature web link / simple explanation / description step 3 details',
            })
          : intl.formatMessage({
              defaultMessage: `Select the “Create new” option and paste your signature into the text box.`,
              id: 'o/dCiC',
              description:
                'Signature web link / normal explanation / description step 3 details',
            })}
      </div>
      <div className={styles.separator} />
      <div className={styles.stepText}>
        {intl.formatMessage({
          defaultMessage: 'STEP 4',
          id: 'b5Pyzb',
          description: 'Signature web link / explanation / description step 4',
        })}
      </div>
      <div className={styles.stepDesc}>
        {intl.formatMessage({
          defaultMessage:
            'In the “Signature Defaults” subsection, select your newly created signature as default and then scroll down to the very bottom of the page and select the “Save” button',
          id: '+LeqWU',
          description:
            'Signature web link / explanation / description step 4 details',
        })}
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
  <table  border="0" cellpadding="0" cellspacing="0" style="width:550px; text-decoration: unset !important;">
    <tbody>`;
  if (avatarUrl) {
    card += `<tr>
              <td height="60px" valign="top" colspan="2">
                <img width="60px" height="60px" style="width: 60px; height: 60px; border-radius: 30px; margin-bottom: 20px;"  src="${avatarUrl}" />
              </td>
            </tr>`;
  }
  card += `<tr>
            <td height="100%" valign="top" style="width:225px">
              <table style="max-width:225px; width 100%">
                <tbody>`;
  if (displayName) {
    card += `<tr><td style="margin-bottom:5px"><span style="text-align: left; color: black; font-size: 16px; font-family: Helvetica Neue; font-weight: 500 !important; word-wrap: break-word; line-height: 20px;">${displayName}</span></td></tr>`;
  }
  if (title) {
    card += `<tr><td style="margin-bottom:5px"><span style="text-align: left; color: black; font-size: 14px; font-family: Helvetica Neue; font-weight: 500; word-wrap: break-word; color: ${primaryColor};line-height: 18px;">${title}</span></td></tr>`;
  }
  if (company) {
    card += `<tr><td style="text-align: left; color: black; font-size: 12px; font-family: Helvetica Neue; font-weight: 400; word-wrap: break-word; color : #87878E; margin-bottom:5px">${company}</td></tr>`;
  }
  card += `<tr>
            <td>
              <a href="${url}" rel=“noopener” noreferrer target=“_blank”  style="text-decoration: none !important;">
                <table style="background-color: ${primaryColor};height:34px;width:125px;padding-left: 10px;padding-right: 10px;border-radius:48px;font-size:12px;margin-top:12px">
                <tbody> 
                  <tr>
                    <td style="vertical-align: middle; text-align: center;color: ${readableColor}; font-size: 12px; font-family: Helvetica; font-weight: 700">
                      <span style="text-decoration: unset !important;color: ${readableColor};">Save my contact</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              </a>
            </td>
          </tr>`;

  card += `</tbody>
          </table>
          </td>
          <td  height="100%" valign="top" style="padding-left: 15px; width:300px, border-left: 1px solid  #E2E1E3">
            <table style="width:300px; width 100%">`;
  if (phones) {
    for (let index = 0; index < phones.length; index++) {
      const formattedPoneNumber = formatPhoneNumberUri(phones[index]);
      if (formattedPoneNumber) {
        card += `<tr>
                    <td style="height:20px; width:100%; display:inline-block; vertical-align: middle;">
                       <a href="${formattedPoneNumber}" rel=“noopener” noreferrer target=“_blank” style="text-decoration: unset !important;color:black;font-size: 12px;font-weight:400px; color: black">
                           <img src="${process.env.NEXT_PUBLIC_URL}${phoneLogo.src}"   height="14px" width="14px" style="width: 14px; height: 14px;vertical-align: middle"/>
                         <span style="text-decoration: unset !important;color:black;font-size: 12px;font-weight:400px; color: black">${phones[index]}</span>
                      </a>
                    </td>
                  </tr>`;
      }
    }
  }
  if (mails) {
    for (let index = 0; index < mails.length; index++) {
      card += `<tr>
             <td style="height:20px; width:100%; display:inline-block; vertical-align: middle;">
                 
                   <a href="mailto:${mails[index]}" rel=“noopener” noreferrer target=“_blank”  style="text-decoration: unset !important;color:black;font-size: 12px;font-weight:400px; color: black">
                      <img src="${process.env.NEXT_PUBLIC_URL}${mailLogo.src}"   height="14px" width="14px" style="width: 14px; height: 14px;vertical-align: middle"/>
                   <span style="text-decoration: unset !important;color:black;font-size: 12px;font-weight:400px; color: black;text-decoration: unset !important;">${mails[index]}</span>
                  </a>
                </td>
              </tr>`;
    }
  }
  if (companyLogo) {
    card += `<tr>
              <td>
                <a href="${url}" rel=“noopener” noreferrer target=“_blank”  style="text-decoration: unset !important;">
                  <img style="margin-top:15px; height: 60px; object-fit: contain;max-width:195px;" src="${companyLogo}" />
                </a>
              </td>
            </tr>`;
  }
  card += `</table>
          </td>
        </tr>
      </tbody>
    </table>
        `;

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
