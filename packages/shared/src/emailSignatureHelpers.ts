import { csv2json, json2csv } from 'csv42';
import type { ContactCard, CommonInformation } from 'contactCardHelpers';

export function buildCardSignature(
  url: string,
  avatarUrl: string | null | undefined,
  webCardUrl: string,
  displayName: string | null | undefined,
  title: string | null | undefined,
  company: string | null | undefined,
  qrCode: string,
  phones: string[] | null | undefined,
) {
  let card = `
  <a href="{url}"
  rel=“noopener” noreferrer target=“_blank”
  style="text-decoration: none; color: black;padding-left: 30px;padding-right: 30px">
  <table  border="0" cellpadding="0" cellspacing="0" width="100%"
    style="border: 1px solid black;table-layout: fixed;width: 450px; padding-left: 15px; padding-right: 15px; padding-top: 20px; padding-bottom: 20px; background: white; border-radius: 20px; overflow: hidden;gap: 15px;box-shadow:0px 4px 16px 0px rgba(0, 0, 0, 0.25);">
    <tbody>`;
  if (avatarUrl) {
    card += `<tr> 
        <td height="100%" valign="top">
          <img style="width: 70px; height: 70px; border-radius: 35px; margin-bottom: 10px;"
            src="${avatarUrl}" />
        </td>
      </tr>`;
  }
  card += `<tr>
        <td height="60%" valign="top">
            <div
              style=" gap: 12.50px;">
              <div
                style="gap: 5px; ">`;
  if (displayName) {
    card += `<div style="text-align: left; color: black; font-size: 16px; font-family: Helvetica Neue; font-weight: 700; word-wrap: break-word">${displayName}</div>`;
  }
  if (title) {
    card += `<div style="text-align: left; color: black; font-size: 14px; font-family: Helvetica Neue; font-weight: 400; word-wrap: break-word">${title}</div>`;
  }
  if (company) {
    card += `<div  style="text-align: left; color: black; font-size: 14px; font-family: Helvetica Neue; font-weight: 400; word-wrap: break-word">${company}</div>`;
  }
  card += `</div> </div>`;
  if (phones) {
    card += ` <div style="text-align: left; color: black; font-size: 14px; font-family: Helvetica Neue; font-weight: 400; word-wrap: break-word; margin-top:10px;">`;
    for (let index = 0; index < phones.length; index++) {
      card += ` <div style="margin-top:4px">${phones[index]}</div>`;
    }
    card += `</div>`;
  }
  card += `<table
            style="border: 1px solid black;background: white;height:34px;padding-left: 10px;padding-right: 10px;border-radius:48px;box-shadow:0px 4px 16px 0px rgba(0, 0, 0, 0.25);font-size:12px;margin-top:12px">
            <tbody> 
              <tr>
                <td style="background: white;vertical-align: middle; text-align: center;color: black; font-size: 12px; font-family: Helvetica; font-weight: 700">
                  Save my contact
                </td>
              </tr>
            </tbody>
          </table>
        </td>
        <td height="40%" valign="top" align="right">
          <img style="width: 43.32px; height: 69.50px; border-radius: 8px"
            src="${webCardUrl}"/>
          <img style="width: 69.50px; align-self: stretch"
            src="${qrCode}"/>
        </td>
      </tr>
    </tbody>
  </table>
</a>`;

  return card;
}

export function buildSaveMyContactSignature(url: string) {
  return `
  <a href="${url}" rel=“noopener” noreferrer target=“_blank” style="text-decoration: none; color: black;padding-left: 30px;padding-right: 30px">
    <table style="border: 1px solid black;height:34px;padding-left: 10px;padding-right: 10px;border-radius:48px;box-shadow:0px 4px 16px 0px rgba(0, 0, 0, 0.25);font-size:12px;border: 1px solid black;">
      <tr>
        <td style="vertical-align: middle; text-align: center;">
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
    phoneNumbers,
    avatar,
    createdAt,
  };
};
