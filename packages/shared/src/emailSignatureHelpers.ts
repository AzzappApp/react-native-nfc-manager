import { csv2json, json2csv } from 'csv42';
import type { ContactCard, CommonInformation } from './contactCardHelpers';

export function buildCardSignature(
  url: string,
  avatarUrl: string | null | undefined,
  webCardUrl: string,
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
  <a href="${url}"
  rel=“noopener” noreferrer target=“_blank”
  style="text-decoration: unset !important; color: black;padding-left: 30px;padding-right: 30px";max-width:100% !important; width:100%;>
  <table  border="0" cellpadding="0" cellspacing="0" width="100%"
    style="table-layout: fixed;max-width: 450px; padding-left: 20px; padding-right: 20px; padding-top: 30px; padding-bottom: 30px; background: white; border-radius: 20px; overflow: hidden;gap: 15px;text-decoration: unset !important">
    <tbody>`;
  if (avatarUrl) {
    card += `<tr> 
        <td height="60px" valign="top" colspan="2">
          <img style="width: 60px; height: 60px; border-radius: 30px; margin-bottom: 20px;"  src="${avatarUrl}" />
        </td>
      </tr>`;
  }
  card += `<tr>
        <td height="100%" valign="top" style="width:50% !important; display:flex; flex-direction:column; justify-content:space-evenly">
           <div style="height: 100%">`;
  if (displayName) {
    card += `<div style="text-align: left; color: black; font-size: 16px; font-family: Helvetica Neue; font-weight: 500; word-wrap: break-word; line-height: 20px; margin-bottom:5px">${displayName}</div>`;
  }
  if (title) {
    card += `<div style="text-align: left; color: black; font-size: 14px; font-family: Helvetica Neue; font-weight: 500; word-wrap: break-word; color: ${primaryColor};line-height: 18px; margin-bottom:5px">${title}</div>`;
  }
  if (company) {
    card += ` <div style="text-align: left; color: black; font-size: 12px; font-family: Helvetica Neue; font-weight: 400; word-wrap: break-word; color : #87878E; margin-bottom:5px">${company}</div>`;
  }
  card += `</div>`;
  card += `<table style="background-color: {{primaryColor}};height:34px;width:140px;padding-left: 10px;padding-right: 10px;border-radius:48px;font-size:12px;margin-top:12px">
            <tbody> 
              <tr>
                <td style="vertical-align: middle; text-align: center;color: ${readableColor}; font-size: 12px; font-family: Helvetica; font-weight: 700">
                  Save my contact
                </td>
              </tr>
            </tbody>
          </table>
        </td>
  </td>
   <td  height="100%" valign="middle" style="width:50% !important; padding-left: 30px; border-left: 1px solid  #E2E1E3">`;

  if (phones) {
    card += ` <div style="text-align: left; color: black; font-size: 12px; font-family: Helvetica Neue; font-weight: 400; word-wrap: break-word; margin-top:10px;">`;
    for (let index = 0; index < phones.length; index++) {
      card += `<div style="height:14px; width:100%; display:inline-block; vertical-align: middle, margin-top: 5px;">
                        <img src="http://cdn.mcauto-images-production.sendgrid.net/b45e0397500ee742/1a9d2a65-3d9d-4759-9ad5-c23b4b8cdcaa/43x42.png"  style="width: 14px; height: 14px;"/>
                        <span style="font-size: 12px;vertical-align: top; height:14px;">
                          ${phones[index]}
                        </span>
                    </div>`;
    }
    card += `</div>`;
  }
  if (mails) {
    card += ` <div style="text-align: left; color: black; font-size: 12px; font-family: Helvetica Neue; font-weight: 400; word-wrap: break-word; margin-top:10px;">`;
    for (let index = 0; index < mails.length; index++) {
      card += `<div style="height:14px; width:100%; display:inline-block; vertical-align: middle, margin-top: 5px;">
                        <img src="http://cdn.mcauto-images-production.sendgrid.net/b45e0397500ee742/cc231bce-ec78-42f8-aeb8-92d200de2a81/43x42.png"  style="width: 14px; height: 14px;"/>
                        <span style="font-size: 12px;vertical-align: top; height:14px;">
                          ${mails[index]}
                        </span>
                    </div>`;
    }
    card += `</div>`;
  }
  if (companyLogo) {
    card += `<img style="margin-top:15px; height: 60px; object-fit: contain;" src="${companyLogo}" />`;
  }
  card += `</td>
      </tr>
    </tbody>
  </table>
</a>`;

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

export type ParsedEmailSignature = [
  string,
  string,
  string,
  string,
  string,
  string,
  string[],
  string[],
  string | undefined,
  string | undefined,
];

export const serializeEmailSignature = (
  profileId: string,
  webCardId: string,
  card: ContactCard | null,
  commonInformation: CommonInformation | null | undefined,
  avatarUrl: string | null,
) => {
  const serializedEmailSignature: ParsedEmailSignature = [
    profileId,
    webCardId,
    card?.firstName ?? '',
    card?.lastName ?? '',
    commonInformation?.company ?? card?.company ?? '',
    card?.title ?? '',
    (commonInformation?.emails ?? [])
      .concat(card?.emails?.filter(p => p.selected) ?? [])
      .map(({ address }) => address),
    (commonInformation?.phoneNumbers ?? [])
      .concat(card?.phoneNumbers?.filter(p => p.selected) ?? [])
      .map(({ number }) => number),
    avatarUrl ?? undefined,
    new Date().toISOString(),
  ];

  return json2csv([serializedEmailSignature], { header: false });
};
export type EmailSignatureParsed = {
  profileId: string;
  webCardId: string;
  firstName: string | undefined;
  lastName: string | undefined;
  company: string | undefined;
  title: string | undefined;
  emails: string[] | null;
  phoneNumbers: string[] | null;
  createdAt: string | undefined;
  avatar: string | undefined;
};
/**
 * Parses a contact data from a string
 * @param contactData
 * @returns the parsed contact card
 */
export const parseEmailSignature = (
  emailSignature: string,
): EmailSignatureParsed => {
  const data = csv2json<{
    [key: string]: ParsedEmailSignature;
  }>(emailSignature, { header: false });

  const [
    [
      profileId,
      webCardId,
      firstName,
      lastName,
      company,
      title,
      emails,
      phoneNumbers,
      avatar,
      createdAt,
    ],
  ] = Object.values(data[0]);

  return {
    profileId,
    webCardId,
    firstName,
    lastName,
    company,
    title,
    emails: emails && emails.length > 0 ? emails : ['talere', 'tamere2'],
    phoneNumbers: phoneNumbers ?? ['phone1', 'phone 2'],
    avatar,
    createdAt,
  };
};
