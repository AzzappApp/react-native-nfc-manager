import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';

import {
  createContact,
  getContactByProfiles,
  incrementShareBacks,
  incrementShareBacksTotal,
  transaction,
  updateContact,
} from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { sendPushNotification } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader, userLoader, webCardLoader } from '#loaders';
import type { MutationResolvers } from '#__generated__/types';
import type { Contact, ContactRow } from '@azzapp/data';

const addContact: MutationResolvers['addContact'] = async (
  _,
  { profileId: gqlProfileId, input },
) => {
  const { userId } = getSessionInfos();

  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profileId = fromGlobalId(gqlProfileId).id;
  const profile = await profileLoader.load(profileId);

  if (!profile || profile.userId !== userId) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  const existingContact = await getContactByProfiles({
    owner: profileId,
    contact: input.profileId,
  });

  const contactToCreate: Omit<Contact, 'deletedAt' | 'id'> = {
    addresses: input.addresses,
    contactProfileId: input.profileId,
    emails: input.emails,
    ownerProfileId: profileId,
    phoneNumbers: input.phoneNumbers,
    type: 'contact',
    birthday: input.birthday || null,
    company: input.company,
    firstName: input.firstname,
    lastName: input.lastname,
    title: input.title,
    deleted: false,
    urls: input.urls || null,
    socials: input.socials || null,
    createdAt: new Date(),
  };

  let contact: Contact;

  if (existingContact) {
    await updateContact(existingContact.id, contactToCreate);

    contact = {
      ...existingContact,
      ...contactToCreate,
    };
  } else {
    const id = await createContact(contactToCreate);

    contact = {
      id,
      deletedAt: null,
      ...contactToCreate,
    };
  }

  if (input.withShareBack) {
    const webCard = await webCardLoader.load(profile.webCardId);
    const commonInformation = webCard?.isMultiUser
      ? webCard?.commonInformation
      : undefined;
    const addresses =
      profile.contactCard?.addresses
        ?.filter(address => address.selected)
        .map(address => ({
          label: address.label,
          address: address.address,
        })) || [];

    const emails =
      profile.contactCard?.emails
        ?.filter(email => email.selected)
        .map(email => ({
          label: email.label,
          address: email.address,
        })) || [];

    const phoneNumbers =
      profile.contactCard?.phoneNumbers
        ?.filter(phoneNumber => phoneNumber.selected)
        .map(phoneNumber => ({
          label: phoneNumber.label,
          number: phoneNumber.number,
        })) || [];

    const birthday = profile.contactCard?.birthday?.selected
      ? profile.contactCard.birthday.birthday?.split('T')[0]
      : null;

    const urls = (
      webCard?.userName ? [{ url: buildUserUrl(webCard.userName) }] : []
    ).concat(
      profile.contactCard?.urls?.map(url => ({
        url: url.address,
      })) || [],
    );

    const socials =
      profile.contactCard?.socials?.map(social => ({
        label: social.label,
        url: social.url,
      })) || [];

    const commonInformationToMerge = {
      addresses: commonInformation?.addresses || [],
      emails: commonInformation?.emails || [],
      phoneNumbers: commonInformation?.phoneNumbers || [],
      urls:
        commonInformation?.urls?.map(url => ({
          url: url.address,
        })) || [],
      company: commonInformation?.company,
      socials: commonInformation?.socials || [],
    };

    const shareBackToCreate: ContactRow = {
      ownerProfileId: input.profileId,
      contactProfileId: profileId,
      createdAt: new Date(),
      type: 'shareback' as const,
      addresses: commonInformationToMerge.addresses.concat(addresses),
      emails: commonInformationToMerge.emails.concat(emails),
      phoneNumbers: commonInformationToMerge.phoneNumbers.concat(phoneNumbers),
      birthday,
      company:
        commonInformationToMerge.company ??
        profile.contactCard?.company ??
        undefined,
      firstName: profile.contactCard?.firstName ?? undefined,
      lastName: profile.contactCard?.lastName ?? undefined,
      title: profile.contactCard?.title ?? undefined,
      deleted: false,
      urls: commonInformationToMerge.urls.concat(urls),
      socials: commonInformationToMerge.socials.concat(socials),
    };

    const existingShareBack = await getContactByProfiles({
      owner: input.profileId,
      contact: profileId,
    });

    if (!existingShareBack) {
      await transaction(async () => {
        await createContact(shareBackToCreate);
        await incrementShareBacksTotal(input.profileId);
        await incrementShareBacks(input.profileId, true);
      });
    } else {
      await transaction(async () => {
        await updateContact(existingShareBack.id, shareBackToCreate);
        await incrementShareBacksTotal(input.profileId);
        await incrementShareBacks(input.profileId, true);
      });
    }

    const profileToNotify = await profileLoader.load(input.profileId);

    if (profileToNotify) {
      const userToNotify = await userLoader.load(profileToNotify?.userId);
      if (userToNotify) {
        await sendPushNotification(userToNotify.id, {
          type: 'shareBack',
          mediaId: null,
          sound: 'default',
          deepLink: 'shareBack',
          locale: guessLocale(userToNotify?.locale),
        });
      }
    }
  }

  return {
    contact,
  };
};

export default addContact;
