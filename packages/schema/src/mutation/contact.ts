import { GraphQLError } from 'graphql';
import { fromGlobalId, toGlobalId } from 'graphql-relay';

import {
  createContact as createNewContact,
  getContactByProfiles,
  getWebcardsMediaFromContactIds,
  incrementContactsImportFromScan,
  incrementImportFromScan,
  incrementShareBacks,
  incrementShareBacksTotal,
  referencesMedias,
  removeContacts as deleteContact,
  transaction,
  updateContact,
  getContactById,
  saveContactEnrichment,
} from '@azzapp/data';
import { enrichContact as enrich } from '@azzapp/enrichment';
import { guessLocale } from '@azzapp/i18n';
import { checkMedias } from '@azzapp/service/mediaServices/mediaServices';
import ERRORS from '@azzapp/shared/errors';
import { isDefined } from '@azzapp/shared/isDefined';
import { filterSocialLink } from '@azzapp/shared/socialLinkHelpers';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import { notifyUsers, sendPushNotification } from '#externals';
import { getSessionUser } from '#GraphQLContext';
import {
  contactLoader,
  profileLoader,
  userLoader,
  webCardLoader,
} from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#__generated__/types';
import type { Contact, ContactRow, NewContact } from '@azzapp/data';

export const createContact: MutationResolvers['createContact'] = async (
  _,
  { profileId: gqlProfileId, input, notify, scanUsed, withShareBack },
  context,
) => {
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profileId = fromGlobalId(gqlProfileId).id;
  const profile = await profileLoader.load(profileId);

  if (!profile || profile.userId !== user.id) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }
  const webCard = await webCardLoader.load(profile.webCardId);

  const existingContact = input.contactProfileId
    ? await getContactByProfiles({
        owner: profileId,
        contact: input.contactProfileId,
      })
    : null;

  const data = [input.avatarId, input.logoId].filter(isDefined);
  if (data.length) {
    await checkMedias(data);
    await referencesMedias(data, null);
  }

  const contactToCreate: NewContact = {
    ...input,
    addresses: input.addresses ?? [],
    emails: input.emails ?? [],
    ownerProfileId: profileId,
    phoneNumbers: input.phoneNumbers ?? [],
    type: 'contact',
    company: input.company || '',
    title: input.title || '',
    birthday: input.birthday || null,
    firstName: input.firstName || '',
    lastName: input.lastName || '',
    meetingDate: input.meetingDate ?? undefined,
    socials: input.socials === null ? [] : filterSocialLink(input.socials),
  };

  let contact: Contact;

  if (existingContact) {
    await updateContact(existingContact.id, contactToCreate);

    contact = {
      ...existingContact,
      ...contactToCreate,
    };
  } else {
    const id = await createNewContact(contactToCreate);

    contact = await getContactById(id);
  }

  if (scanUsed) {
    await validateCurrentSubscription(
      user.id,
      {
        action: 'ADD_CONTACT_WITH_SCAN',
      },
      context.apiEndpoint,
    );
    await incrementContactsImportFromScan(profileId);
    await incrementImportFromScan(profileId, true);
  }

  if (withShareBack && input.contactProfileId) {
    const commonInformation = webCard?.isMultiUser
      ? webCard?.commonInformation
      : undefined;
    const addresses =
      profile.contactCard?.addresses?.map(address => ({
        label: address.label,
        address: address.address,
      })) || [];

    const emails =
      profile.contactCard?.emails?.map(email => ({
        label: email.label,
        address: email.address,
      })) || [];

    const phoneNumbers =
      profile.contactCard?.phoneNumbers?.map(phoneNumber => ({
        label: phoneNumber.label,
        number: phoneNumber.number,
      })) || [];

    const birthday =
      profile.contactCard?.birthday?.birthday?.split('T')[0] ?? null;

    const urls = (
      webCard?.userName ? [{ url: buildWebUrl(webCard.userName) }] : []
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
      ownerProfileId: input.contactProfileId,
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
      meetingLocation: input.location ?? null,
      meetingPlace: input.meetingPlace ?? null,
    };

    const existingShareBack = await getContactByProfiles({
      owner: input.contactProfileId,
      contact: profileId,
    });

    const inputProfileId = input.contactProfileId;

    if (inputProfileId) {
      if (!existingShareBack) {
        await transaction(async () => {
          await createNewContact(shareBackToCreate);
          await incrementShareBacksTotal(inputProfileId);
          await incrementShareBacks(inputProfileId, true);
        });
      } else {
        await transaction(async () => {
          await updateContact(existingShareBack.id, shareBackToCreate);
          await incrementShareBacksTotal(inputProfileId);
          await incrementShareBacks(inputProfileId, true);
        });
      }
    }

    const profileToNotify = await profileLoader.load(input.contactProfileId);

    if (profileToNotify) {
      const userToNotify = await userLoader.load(profileToNotify?.userId);
      if (userToNotify) {
        await sendPushNotification(userToNotify.id, {
          notification: {
            type: 'shareBack',
            webCardId: toGlobalId('WebCard', profileToNotify.webCardId),
          },
          mediaId: null,
          sound: 'default',
          locale: guessLocale(userToNotify?.locale),
        });
      }
    }
  }

  if (notify && input.emails && input.emails.length > 0 && webCard) {
    const user = await userLoader.load(profile?.userId);
    await notifyUsers(
      'email',
      input.emails.map(({ address }) => address!),
      webCard,
      'vcard',
      guessLocale(user?.locale),
      {
        profile,
        contact: {
          firstName: input.firstName,
          lastName: input.lastName,
        },
      },
    );
  }

  return {
    contact,
  };
};

export const saveContact: MutationResolvers['saveContact'] = async (
  _,
  { contactId: gqlContactId, input },
) => {
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const contactId = fromGlobalId(gqlContactId).id;
  const existingContact = await contactLoader.load(contactId);

  if (existingContact === null) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const profile = await profileLoader.load(existingContact.ownerProfileId);

  if (!profile || profile.userId !== user.id) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  const data = [input.avatarId, input.logoId].filter(isDefined);
  if (data.length) {
    await checkMedias(data);
    await referencesMedias(data, null);
  }

  const contactToUpdate: Partial<Omit<Contact, 'id' | 'meetingLocation'>> = {
    ...input,
    socials: input.socials === null ? [] : filterSocialLink(input.socials),
    // updatable fields
    emails: input.emails === null ? [] : input.emails,
    phoneNumbers: input.phoneNumbers === null ? [] : input.phoneNumbers,
    addresses: input.addresses === null ? [] : input.addresses,
    company: input.company === null ? '' : input.company,
    title: input.title === null ? '' : input.title,
    firstName: input.firstName === null ? '' : input.firstName,
    lastName: input.lastName === null ? '' : input.lastName,
    meetingDate: input.meetingDate === null ? undefined : input.meetingDate,
    // TODO: meetingLocation cannot be retrieved for now
    // We should implement fromDriver
    // meetingLocation:
    //   'location' in input &&
    //   input.location?.latitude &&
    //   input.location?.longitude
    //     ? input.location
    //     : existingContact.meetingLocation,
  };

  await updateContact(contactId, contactToUpdate);

  return { ...existingContact, ...contactToUpdate } as Contact;
};

export const removeContacts: MutationResolvers['removeContacts'] = async (
  _,
  { profileId: gqlProfileId, input },
) => {
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');

  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profile = await profileLoader.load(profileId);

  if (profile?.userId !== user.id) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  const contactIdsToRemove = input.contactIds.map(contactIdToRemove =>
    fromGlobalIdWithType(contactIdToRemove, 'Contact'),
  );

  const data = await getWebcardsMediaFromContactIds(contactIdsToRemove);
  if (data.length) {
    await referencesMedias([], data);
  }
  await deleteContact(profileId, contactIdsToRemove);

  return {
    removedContactIds: input.contactIds,
  };
};

export const enrichContact: MutationResolvers['enrichContact'] = async (
  _,
  { contactId: gqlContactId },
) => {
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const contactId = fromGlobalId(gqlContactId).id;
  const existingContact = await contactLoader.load(contactId);

  if (existingContact === null) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const profile = await profileLoader.load(existingContact.ownerProfileId);

  if (!profile || profile.userId !== user.id) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  const {
    enriched: { contact, profile: publicProfile },
    trace,
  } = await enrich({
    contact: existingContact,
  });

  const medias = [
    contact.avatarId,
    contact.logoId,
    ...(publicProfile?.positions?.map(p => p.logoId) ?? []),
    ...(publicProfile?.education?.map(e => e.logoId) ?? []),
  ].filter(isDefined);

  await checkMedias(medias);

  if (Object.keys(trace).length > 0) {
    await transaction(async () => {
      await referencesMedias(medias, null);
      await saveContactEnrichment({
        contactId,
        fields: contact,
        publicProfile,
        trace,
      });
    });
  }

  return {
    contact: existingContact,
  };
};
