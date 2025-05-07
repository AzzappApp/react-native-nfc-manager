import { mergeContactCardWithCommonInfos } from '@azzapp/service/contactCardServices';
import { getImageURLForSize } from '@azzapp/service/mediaServices/imageHelpers';
import {
  getEmailSignatureTitleColor,
  colors,
} from '@azzapp/shared/colorsHelpers';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import renderSaveMyContactButton from './renderSaveMyContactButton';
import type { Profile, WebCard } from '@azzapp/data';

const renderFullEmailSignature = ({
  webCard,
  profile,
  companyLogoUrl,
  bannerUrl,
  saveContactMessage,
  saveContactURL,
  isPreview,
}: {
  webCard: WebCard;
  profile: Profile;
  companyLogoUrl: string | null;
  bannerUrl: string | null;
  saveContactMessage: string;
  saveContactURL?: string;
  isPreview?: boolean;
}) => {
  const avatar = profile.avatarId
    ? getImageURLForSize({
        id: profile.avatarId,
        height: 120,
        width: 120,
        radius: 100,
        format: 'png',
      })
    : null;

  const contactCard = mergeContactCardWithCommonInfos(
    webCard,
    profile.contactCard,
  );

  const avatarSection = avatar
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
            src="${avatar}"
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
          ${formatDisplayName(contactCard.firstName, contactCard.lastName)}
        </span>
      </td>
    </tr>
  `;

  const titleColor = getEmailSignatureTitleColor(webCard.cardColors?.primary);

  const titleSection = contactCard?.title
    ? `<tr valign="top">
        <td style="padding-bottom: 5px;" >
          <span style="
            color: ${titleColor};
            line-height: 10px;
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;"
          >
            ${contactCard.title}
          </span>
        </td>
      </tr>`
    : '';

  const companySection = contactCard.company
    ? `<tr valign="top">
        <td style="padding-bottom: 5px;" >
          <span style="
            color: #87878E;
            font-size: 12px;
            line-height: 14px;
            font-weight: 400;
            white-space: nowrap;"
          >
            ${contactCard.company}
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
    contactCard?.phoneNumbers && contactCard?.phoneNumbers.length > 0
      ? contactCard?.phoneNumbers
          .map(phone =>
            generateContactLink(`tel:${phone.number}`, phone.number),
          )
          .join('')
      : '';

  const emailSection =
    contactCard?.emails && contactCard?.emails.length > 0
      ? contactCard?.emails
          .map(mail =>
            generateContactLink(`mailto:${mail.address}`, mail.address),
          )
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

  const bannerSection = bannerUrl
    ? `
      <tr>
        <td colspan="2" style="padding: 0; padding-top:20px">
          <img
            width="100%"
            style="
              display: inline-block;
              max-width: 600px;
              object-fit: fill;"
            src="${bannerUrl}"
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
      ${bannerSection}
    </tbody>
  </table>`;
};

export default renderFullEmailSignature;
