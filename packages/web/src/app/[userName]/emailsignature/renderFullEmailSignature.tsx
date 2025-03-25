import chroma from 'chroma-js';
import { colors } from '@azzapp/shared/colorsHelpers';
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
}: {
  contact: EmailSignatureParsed | undefined;
  webCard: WebCard;
  companyLogoUrl: string | null;
  saveContactMessage: string;
  saveContactURL?: string;
}) => {
  const avatarToUse = contact?.avatar || companyLogoUrl;
  const avatarSection = avatarToUse
    ? `
      <tr>
        <td colSpan="2" valign="top" style="padding-bottom: 10px;">
          <img
            style="
              width: 60px;
              height: 60px;
              display: inline-block; 
              border-radius: 30px;" 
            src="${avatarToUse}"
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
          src="${logo}"
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
          .map(phone => generateContactLink(`tel:${phone}`, phone, phoneIcon))
          .join('')
      : '';

  const emailSection =
    contact?.emails && contact?.emails.length > 0
      ? contact?.emails
          .map(mail => generateContactLink(`mailto:${mail}`, mail, mailIcon))
          .join('')
      : '';

  const companyLogoSection =
    contact?.avatar && companyLogoUrl
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
            saveContactURL: saveContactURL ?? '#',
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

const mailIcon =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD0AAAA9CAYAAAAeYmHpAAAD7klEQVR4AeWbjXXaMBDHz52AbGAmKJmgzgSlE4QN8AY4EySZgG5AMoHdCSATWBvABtc7JPNsY1uS8ZfC770LAVtGf590kqUD4A7xYCAQcUYvPtmCbKYs40Qm1OvB87wT9EhvokmkTy9Lsl8ghfoWxQXZgeyTLKGbIGCqsDfJQrIYu2VPtlI3choosRuyI/ZLSrYdVfyAYsvw921gaOhLA3XnxyTFobyO0rtToj+vo2zOMU6THcphUYvxkIWyGX2Q/YTpIsiedEOckWglOAa7sXYsBGiEa0WrJrMHNwRn8MTmqW5m9wP0bMEtwQzPAHd1BxtFo4yKS3CTAGuiem3zVv04BffhZp7kP2gSzYJ9aOBwOMDp1OsDkZYgCHSnCLJH7ZMbGkw+wjBEPnVsW61WaECU1+dVCPZBRuvGgZ7uHEwFqrPuFPbyPPN2VSCLQCPYQVhPmL0puMtmEuKYp5mLt8ueDsC9MdkU9vaK/ymLXsONLJf9DOsdXfd34R03bbQAKiLpZrM5H3t9fe00QvP1GL5+1XFL/Lxoo9hfJ3q9XheO7/d79H3/JrGz2QzjOC5ct2qotCTMN++b2s/Dw0Ph/WKxAKowkHBoA5ejG2cy+bAluPyHlks/UOEZqiAej8XlsjRNkW6AlYf5fC6Xh69L/bqL5p1mgmdoSV2FuUmXK8yYzuBYmO2Na1F3yBb5bAs2Cuc+XaYuEEFNXMgE62JDi7qfSy3REhOvvb29XZXb7XbnAAU1kT8PB7Gqc7sSHaIlpv0ziqKrsnnvsajtdnt1Dt8w0+9oUfdzqahFQWPj/lwlnAMfPZ5eHeMbZXP9FnXvXzTUROQyHMD4UdH22i3qPoxogPrIngm2Hdom26fLVjXLMonQfYi2moLeIjqzLLJzn751utpW9AItuVU0G09ETIakrkV7SjQ/ax7BAgcXES6cHzjU2pGA+0Dkn7K+4D74yotO4D74uHRMtNzRcLhPzy+eVlubCXxvOEdNlBcGP+F7885/yuvePHRxE9cu9jvYvAWozfqCp9XQ9Q7fk0vmYdVelpG3HdzLesxEX+1lmXr7+fkZpgAtMZmc9p7PQal0FxrmmSRJAmNC8/bzUrMGQYLn+Q+aNuUDkJt5rjMvZxrV5pyolIUXcJuXqtQqk5Qq9nYA7vFBgv9UHTDNI2Ph2s4zIQQ05Jlo88hUwT/gzqOngIbEOcYkeS6blz/B9IXz47E2N9RINKMu9AgyKXaKJGSB19fvPbDFknHPRDAEKDMXUhyXFOV8YlhQen2M33Dw946X+oXS63+xf8+PL7aMEs8bB3vslhjlLkwnYvv+BV4AMo2p7S/w/oGcWQnokP+aTovZ3AVGNgAAAABJRU5ErkJggg==';
const phoneIcon =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD0AAAA9CAYAAAAeYmHpAAAD40lEQVR4AeWbgXXiMAyGxU1AN0gnOG6CphNAN2CDsgFhhE4AnQA6QdoJ6E2QbAAb6KTY6QsQx06wE+Xd956aNkDhtxRJsQ3Af8gEegIRp3SIyGZkU20lZ7JcH78nk8kZAhJMNImM6LAgewIlNGrx8pzsm+yD7JMGIQepsDfJVmQp+uVIttQDKQMtdk12wrBkZNtBxfco9hp+vzX0Db1prEd+SDLsy+uovCuJcF5HFc4pymSPqixacS5ZqMLoQPYb5JKTPdtKnJNoLTiFdrV2KHKwCLeK1iFzhHEILuHG5tnU2f0CO1sYl2CGO8C96cFG0aiy4gLGSYyGrG4Mb30dZzB+OMw/qyeaRLPgCCycz2fI87w41jGbzWA6daokocjJ/ljv3LBF8xFFEfJLTLZcLlEAiU1whI699PF4bBTMRp5GAbCen3CrS2QJXN7gGzGFdBUOfQGwnlX5x4VoVMnrCTxSXvMCeC29fe3pGALU5K+vLxAAC17yL9eiX6EFlMScnrfb7UAIc/7xU7KwQ13m0H14eLA+j0tWlmVDl66Sx6qnY2gJi3ARwoPz/v4OQlhURXdqN7n5cEFQiMdV0Z3uk11Fz+dzEILSiWpGpBNpmjY2JxT+xXMkUYqOsSOn06kQVic4juPicWmU4d05rXIiqwtxPr/f76Vk7AtK0RHcwXp9e9vKGfvt7Q3EQh5P8E7qQpzPSQ7vu1mtVjfn2NubzQZEgh48zR413VtLzd4r9MB2u60VzYNBbShKoRTtbXqDyxQYJhOkXN+laG/TG+xRU92WIrwU3bkjq4Pqs7FDcwn1JEmKAaJ+PcggVZNZhh6h2t0o3JTc6gZssVgUA+ApL2RV0Qf0TJNwNipzF0L4d9vsKl86nDf4tR2j4FAV7SWDX2MTziLZiwxPF4NldtVDKVxWRUcYCJvw0oNtBN8hOoIqGHDBna9VW+j2IJpXX28mBj8gEJSMgD5kcRyQ2zsgVKUreCHlzs2H11t6OkPTphz00Ie7cq/4lqK3YAJ78nYVvt65FgcUzXoiaAJ79PbFJ6O6ywPANZhrcVNG5whpQVLVNzF5G4TsM6lb/+aVFdfVFSKntenH6ommRfkY1I6isfN4vdPIOHOitywInfZwZlO3tcplSxV7O4bxcSDBL3UPuO4jY+FuSxkyyKFhn4l1YlC/8EX/ozGQQ8PGOcZpNlRfF88gX/hfcNgb6jwFrP/RH1CbYiXySRYH+74HDtS8NJBAH6C6/85wWDJU/US/oPL6EN/h4PcdbnUQldd3GN7zw4u9RovnhYMj+iVFNYfnRWzob+DFoLYxdf0GHm9AO/jOyP8AzKmfTzecOEcAAAAASUVORK5CYII=';
