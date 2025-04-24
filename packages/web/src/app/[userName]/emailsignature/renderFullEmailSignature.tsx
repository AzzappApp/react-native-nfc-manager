import {
  getEmailSignatureTitleColor,
  colors,
} from '@azzapp/shared/colorsHelpers';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import renderSaveMyContactButton from './renderSaveMyContactButton';
import type { WebCard } from '@azzapp/data';
import type { EmailSignatureParsed } from '@azzapp/shared/emailSignatureHelpers';

const renderFullEmailSignature = ({
  contact,
  webCard,
  companyLogoUrl,
  saveContactMessage,
  saveContactURL,
  isPreview,
}: {
  contact: EmailSignatureParsed | undefined;
  webCard: WebCard;
  companyLogoUrl: string | null;
  saveContactMessage: string;
  saveContactURL?: string;
  isPreview?: boolean;
}) => {
  const avatarSection = contact?.avatar
    ? `
      <tr>
        <td colSpan="2" width="60" valign="top" style="padding-bottom: 10px; width: 60px;">
          <img
            height="60"
            width="60"
            style="
              width: 60px;
              height: 60px;
              display: inline-block; 
              border-radius: 30px;" 
            src="${contact?.avatar}"
          />
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
          font-weight: 500;
          white-space: nowrap;"
        >
          ${formatDisplayName(contact?.firstName, contact?.lastName)}
        </span>
      </td>
    </tr>
  `;

  const titleColor = getEmailSignatureTitleColor(webCard.cardColors?.primary);

  const titleSection = contact?.title
    ? `<tr valign="top">
        <td style="padding-bottom: 5px;" >
          <span style="
            color: ${titleColor};
            line-height: 10px;
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;"
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
            font-weight: 400;
            white-space: nowrap;"
          >
            ${contact.company}
          </span>
        </td>
      </tr>`
    : '';

  const generateContactLink = (href: string, text: string) =>
    `<tr>
      <td 
        title="${text}" 
        valign="middle"
        style="
        padding: 0px 0px 5px 0px; 
        vertical-align: middle;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;${isPreview ? 'max-width: 0;' : ''}" >
        <a
          style="
            padding: 0;
            font-size: 12px;
            line-height: 14px;
            font-weight: 400;
            text-align: center;
            color: black;
            text-align: left;
            text-decoration: none;
            text-decoration: unset;"
          href="${href}"
        >${text}</a>
      </td>
    </tr>
    `;

  const phoneSection =
    contact?.phoneNumbers && contact?.phoneNumbers.length > 0
      ? contact?.phoneNumbers
          .map(phone => generateContactLink(`tel:${phone}`, phone))
          .join('')
      : '';

  const emailSection =
    contact?.emails && contact?.emails.length > 0
      ? contact?.emails
          .map(mail => generateContactLink(`mailto:${mail}`, mail))
          .join('')
      : '';

  const companyLogoSection = companyLogoUrl
    ? `
      <tr>
        <td colspan="2" style="padding: 0; height: 60px; max-height: 60px;">
          <img
            height="60"
            style="
              display: inline-block;
              height: 60px;
              max-height: 60px;
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
      font-family: Helvetica Neue;
      border-collapse: collapse;
      ${isPreview ? 'width: 100%;' : ''}"
    >
    <tbody>
      ${avatarSection}
      <tr>
        <td
          valign="top"
          style="border-right: 1px solid #E2E1E3; padding-right: 15px;${isPreview ? 'width: 1%;' : ''}"
        >
          <table cellspacing="0" cellpadding="0">
            ${nameSection}
            ${titleSection}
            ${companySection}
            <tr>
              <td style="padding-top: 12px;">
                ${renderSaveMyContactButton({
                  primaryColor: webCard.cardColors?.primary ?? colors.black,
                  saveContactMessage,
                  saveContactURL: saveContactURL ?? '#',
                })}
              </td>
            </tr>
          </table>
        </td>
        <td valign="top">
          <table cellspacing="0" cellpadding="0" style="padding-left: 15px;${isPreview ? 'width: 100%;' : ''}">
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
