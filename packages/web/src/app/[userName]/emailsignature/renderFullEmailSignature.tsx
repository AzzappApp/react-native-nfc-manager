import chroma from 'chroma-js';
import { colors } from '@azzapp/shared/colorsHelpers';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import mailLogo from '@azzapp/web/public/signature/mail.png';
import phoneLogo from '@azzapp/web/public/signature/phone.png';
import renderSaveMyContactButton from './renderSaveMyContactButton';
import type { WebCard } from '@azzapp/data';
import type { EmailSignatureParsed } from '@azzapp/shared/emailSignatureHelpers';

const renderFullEmailSignature = ({
  contact,
  webCard,
  companyLogoUrl,
  saveContactMessage,
  saveContactURL,
}: {
  contact: EmailSignatureParsed | undefined;
  webCard: WebCard;
  companyLogoUrl: string | null;
  saveContactMessage: string;
  saveContactURL?: string;
}) => {
  const avatarSection = contact?.avatar
    ? `
      <tr>
        <td colSpan="2" valign="top" style="padding-bottom: 10px;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              href="#" 
              style="height:60px; width:60px; v-text-anchor:middle;" 
              arcsize="50%" stroke="f" fillcolor="none">
              <v:fill src="${contact.avatar}" type="frame"/>
              <w:anchorlock/>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]> <!-->
          <img
            style="
              width: 60px;
              height: 60px;
              display: inline-block; 
              border-radius: 30px;" 
            src="${contact.avatar}"
          />
          <![endif]-->
        </td>
      </tr>
    `
    : '';

  const nameSection = `
    <tr valign="top">
      <td style="padding-bottom: 5px;" >
        <span style="
          color: black;
          line-height: 20px;
          font-size: 16px;
          font-weight: 500;"
        >
          ${formatDisplayName(contact?.firstName, contact?.lastName)}
        </span>
      </td>
    </tr>
  `;

  let titleColor = webCard.cardColors?.primary ?? colors.black;
  const rgba = chroma(titleColor).rgba();
  if (rgba[0] * 0.299 + rgba[1] * 0.587 + rgba[2] * 0.114 > 186) {
    titleColor = '#54535B';
  }

  const titleSection = contact?.title
    ? `<tr valign="top">
        <td style="padding-bottom: 5px;" >
          <span style="
            color: ${titleColor};"
            line-height: 10px;
            font-size: 14px;
            font-weight: 500;
          >
            ${contact.title}
          </span>
        </td>
      </tr>`
    : '';

  const companySection = contact?.company
    ? `<tr valign="top">
        <td style="padding-bottom: 5px;" >
          <span style="
            color: #87878E;
            font-size: 12px;
            line-height: 14px;
            font-weight: 400;"
          >
            ${contact.company}
          </span>
        </td>
      </tr>`
    : '';

  const generateContactLink = (href: string, text: string, logo: string) =>
    `<tr>
      <td style="padding: 0; vertical-align: middle;" valign="middle">
        <img
          src="${removeDoubleSlash(`${logo}`)}"
          width="20"
          height="20"
        />
      </td>
      <td style="padding: 0 0 5px 4px; vertical-align: middle;" valign="middle">
        <a
          style="
            padding: 0;
            font-size: 12px;
            line-height: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: 400;
            text-align: center;
            color: black;
            text-align: left;
            text-decoration: none;
            text-decoration: unset;"
          href="${href}"
        >
          ${text}
        </a>
      </td>
    </tr>
    `;

  const phoneSection =
    contact?.phoneNumbers && contact?.phoneNumbers.length > 0
      ? contact?.phoneNumbers
          .map(phone =>
            generateContactLink(`tel:${phone}`, phone, phoneLogo.src),
          )
          .join('')
      : '';

  const emailSection =
    contact?.emails && contact?.emails.length > 0
      ? contact?.emails
          .map(mail =>
            generateContactLink(`mailto:${mail}`, mail, mailLogo.src),
          )
          .join('')
      : '';

  const companyLogoSection = companyLogoUrl
    ? `
      <tr>
        <td colspan="2" style="padding: 0;">
          <img
            height="60"
            style="
              display: inline-block;
              height: 60px;
              object-fit: contain;"
            src="${companyLogoUrl}"
          />
        </td>
      </tr>
    `
    : '';

  return `
   <table
    border="0"
    cellpadding="0"
    cellspacing="0"
    style="
      padding: 20px 15px;
      background: white;
      font-family: Helvetica Neue;
      border-collapse: collapse;"
    >
    <tbody>
      ${avatarSection}
      <tr>
        <td
          valign="top"
          style="border-right: 1px solid #E2E1E3; padding-right: 15px; min-width: 160px"
        >
          <table style="padding-bottom: 12px;">
            ${nameSection}
            ${titleSection}
            ${companySection}
          </table>
          ${renderSaveMyContactButton({
            primaryColor: webCard.cardColors?.primary ?? colors.black,
            saveContactMessage,
            url: saveContactURL ?? '#',
          })}
        </td>
        <td valign="top">
          <table style="padding-left: 15px;">
            ${phoneSection}
            ${emailSection}
            ${companyLogoSection}
          </table>
        </td>
      </tr>
    </tbody>
  </table>`;
};

export default renderFullEmailSignature;

const removeDoubleSlash = (url: string) => url.replace(/([^:]\/)\/+/g, '$1');
