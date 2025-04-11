import * as Sentry from '@sentry/react-native';
import { Paths, File } from 'expo-file-system/next';
import ShareCommand from 'react-native-share';
import { buildVCard } from '#helpers/contactHelpers';
import { sanitizeFilePath } from '#helpers/fileHelpers';
import type { ContactType } from '#helpers/contactTypes';

const ShareContact = async (details: ContactType) => {
  const vCardData = await buildVCard(details);

  if (!vCardData) {
    console.error('cannot generate VCard');
    return;
  }
  const contactName =
    `${details?.firstName ?? ''} ${details?.lastName ?? ''}`.trim();
  const filePath =
    Paths.cache.uri +
    sanitizeFilePath(contactName.length ? contactName : 'contact') +
    '.vcf';

  let file;
  try {
    file = new File(filePath);
    file.create();
    // generate file
    file.write(vCardData.toString());
    // share the file
    await ShareCommand.open({
      url: filePath,
      type: 'text/x-vcard',
      failOnCancel: false,
    });
    // clean up file afterward
    file.delete();
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
    file?.delete();
  }
};

export default ShareContact;
