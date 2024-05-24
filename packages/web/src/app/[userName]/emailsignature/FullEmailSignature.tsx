'use client';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { colors, getTextColor } from '@azzapp/shared/colorsHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import {
  buildCardSignature,
  buildSaveMyContactSignature,
  parseEmailSignature,
} from '@azzapp/shared/emailSignatureHelpers';
import { getImageURLForSize } from '@azzapp/shared/imagesHelpers';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
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
}: {
  webCard: WebCard;
  media: Media | null;
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

  const [webCardUrl, setWebCardUrl] = useState<string>('');
  useEffect(() => {
    if (webCard) {
      setWebCardUrl(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/cover/${webCard.userName}?width=${630}&updatedAt=${webCard?.updatedAt.toISOString()}`,
      );
    }
  }, [webCard]);

  const companyLogo = webCard.logoId
    ? getImageURLForSize(webCard.logoId, 140, 140)
    : null;
  const handleCopySignature = async (mode: 'full' | 'simple') => {
    const compressedContactCard = searchParams.get('c') ?? '';
    const url =
      mode === 'full'
        ? buildCardSignature(
            buildUserUrl(webCard.userName) + '?c=' + compressedContactCard,
            contact?.avatar,
            webCardUrl,
            formatDisplayName(contact?.firstName, contact?.lastName),
            contact?.title,
            contact?.company,
            contact?.phoneNumbers,
            contact?.emails,
            companyLogo,
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
  console.log(contact);
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
                        color: '#87878',
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
              valign="middle"
              style={{
                width: '50%',
                paddingLeft: '30px',
                borderLeft: '1px solid  #E2E1E3',
              }}
            >
              {contact?.phoneNumbers && contact?.phoneNumbers.length > 0 && (
                <div
                  style={{
                    textAlign: 'left',
                    color: 'black',
                    fontSize: '12px',
                    fontFamily: 'Helvetica Neue',
                    fontWeight: 400,
                  }}
                >
                  {contact?.phoneNumbers.map(phone => {
                    return (
                      <div
                        key={phone}
                        style={{
                          height: '12px',
                          width: '100%',
                          display: 'inline-block',
                          verticalAlign: 'middle',
                        }}
                      >
                        <img
                          src="http://cdn.mcauto-images-production.sendgrid.net/b45e0397500ee742/1a9d2a65-3d9d-4759-9ad5-c23b4b8cdcaa/43x42.png"
                          style={{
                            width: '14px',
                            height: '14px',
                            marginRight: '4px',
                          }}
                        />
                        {phone}
                      </div>
                    );
                  })}
                </div>
              )}
              {contact?.emails && contact?.emails.length > 0 && (
                <div
                  style={{
                    textAlign: 'left',
                    color: 'black',
                    fontSize: '12px',
                    fontFamily: 'Helvetica Neue',
                    fontWeight: 400,
                    marginTop: '5px',
                  }}
                >
                  {contact?.emails.map(mail => {
                    return (
                      <div
                        key={mail}
                        style={{
                          height: '14px',
                          width: '100%',
                          display: 'inline-block',
                          verticalAlign: 'middle',
                        }}
                      >
                        <img
                          src="http://cdn.mcauto-images-production.sendgrid.net/b45e0397500ee742/cc231bce-ec78-42f8-aeb8-92d200de2a81/43x42.png"
                          style={{
                            width: '14px',
                            height: '14px',
                            marginRight: '4px',
                          }}
                        />
                        <span
                          style={{ fontSize: '12px', verticalAlign: 'top' }}
                        >
                          {mail}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {companyLogo && (
                <img
                  style={{
                    marginTop: '15px',
                    height: '60px',
                    objectFit: 'contain',
                  }}
                  src={companyLogo}
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
