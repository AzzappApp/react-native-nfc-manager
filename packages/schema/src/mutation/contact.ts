import * as Sentry from '@sentry/nextjs';
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
  getEntitiesByIds,
  getContactEnrichmentById,
  getProfileById,
  updateContactEnrichment,
  getProfileByContactEnrichmentId,
} from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import { checkMedias } from '@azzapp/service/mediaServices/mediaServices';
import { sendPushNotification } from '@azzapp/service/notificationsHelpers';
import ERRORS from '@azzapp/shared/errors';
import { isDefined } from '@azzapp/shared/isDefined';
import { filterSocialLink } from '@azzapp/shared/socialLinkHelpers';
import { formatDateToYYYYMMDD } from '@azzapp/shared/timeHelpers';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import env from '#env';
import { notifyUsers } from '#externals';
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
import type { Contact, ContactRow, NewContact, Profile } from '@azzapp/data';

export const createContact: MutationResolvers['createContact'] = async (
  _,
  {
    profileId: gqlProfileId,
    input,
    notify,
    scanUsed,
    withShareBack,
    qrCodeKey,
  },
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

  const dateBirthday = new Date(input.birthday || '');
  const contactToCreate: NewContact = {
    ...input,
    addresses: input.addresses ?? [],
    emails: input.emails ?? [],
    ownerProfileId: profileId,
    phoneNumbers: input.phoneNumbers ?? [],
    type: 'contact',
    company: input.company || '',
    title: input.title || '',
    birthday: !isNaN(dateBirthday.getTime())
      ? formatDateToYYYYMMDD(dateBirthday)
      : null,
    firstName: input.firstName || '',
    lastName: input.lastName || '',
    meetingDate: input.meetingDate ?? undefined,
    socials: input.socials === null ? [] : filterSocialLink(input.socials),
    deleted: false,
    deletedAt: null,
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
        await sendPushNotification(profile.userId, {
          mediaId: null,
          sound: 'default',
          title: context.intl.formatMessage({
            defaultMessage: 'Contact ShareBack',
            id: '0j4O2Z',
            description: 'Push Notification title for contact share back',
          }),
          body: context.intl.formatMessage({
            defaultMessage: `Hello, You've received a new contact ShareBack.`,
            id: 'rAeWtj',
            description:
              'Push Notification body message for contact share back',
          }),
          data: {
            webCardId: toGlobalId('WebCard', profile.webCardId),
            type: 'shareBack',
          },
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
        qrCodeKey,
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
  { input },
) => {
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const contactIdsToRemove = input.contactIds.map(contactIdToRemove =>
    fromGlobalIdWithType(contactIdToRemove, 'Contact'),
  );

  let profiles: Array<Profile | null> = [];
  let mediaIds: string[] = [];
  let contacts: Contact[] = [];
  try {
    contacts = (await getEntitiesByIds('Contact', contactIdsToRemove)).filter(
      contact => !!contact,
    );
    const profileIds = contacts.map(contact => contact.ownerProfileId);
    [profiles, mediaIds] = await Promise.all([
      getEntitiesByIds('Profile', profileIds),
      getWebcardsMediaFromContactIds(contactIdsToRemove).then(ids =>
        ids.filter(mediaId => !!mediaId),
      ),
    ]);
  } catch (error) {
    Sentry.captureException(error);
    console.error(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (!profiles.every(profile => profile && profile.userId === user.id)) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  try {
    await transaction(async () => {
      if (mediaIds.length) {
        await referencesMedias([], mediaIds);
      }
      await deleteContact(contactIdsToRemove);
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error(error);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return {
    removedContactIds: contacts.map(contact => {
      return toGlobalId('Contact', contact.id);
    }),
  };
};

export const enrichContact: MutationResolvers['enrichContact'] = async (
  _,
  { contactId: gqlContactId },
  { enrichContact },
) => {
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (
    !user.freeEnrichments &&
    user.nbEnrichments >= parseInt(env.MAX_ENRICHMENTS_PER_USER, 10)
  ) {
    throw new GraphQLError(ERRORS.MAX_ENRICHMENTS_REACHED);
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

  await updateContact(contactId, {
    enrichmentStatus: 'pending',
  });

  enrichContact(user.id, existingContact);

  return {
    contact: existingContact,
  };
};

export const cancelEnrichContact: MutationResolvers['cancelEnrichContact'] =
  async (_, { contactId: gqlContactId }, { cancelEnrichContact }) => {
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
    cancelEnrichContact(user.id, existingContact.id);

    await updateContact(contactId, {
      enrichmentStatus: 'canceled',
    });

    return {
      contact: existingContact,
    };
  };

export const updateContactEnrichmentHiddenFields: MutationResolvers['updateContactEnrichmentHiddenFields'] =
  async (_, { contactEnrichmentId: gqlContactEnrichmentId, input }) => {
    const user = await getSessionUser();
    if (!user) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const contactEnrichmentId = fromGlobalId(gqlContactEnrichmentId).id;
    const existingContactEnrichment =
      await getContactEnrichmentById(contactEnrichmentId);

    const existingContact = await getContactById(
      existingContactEnrichment.contactId,
    );

    if (existingContact === null || existingContactEnrichment === null) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const profile = await getProfileById(existingContact.ownerProfileId);

    if (!profile || profile.userId !== user.id) {
      throw new GraphQLError(ERRORS.FORBIDDEN);
    }

    await updateContactEnrichment(contactEnrichmentId, {
      hiddenFields: input,
    });

    return {
      contactEnrichment: existingContactEnrichment,
    };
  };

export const approveContactEnrichment: MutationResolvers['approveContactEnrichment'] =
  async (
    _,
    { contactEnrichmentId: gqlContactEnrichmentId, approved, input },
  ) => {
    const user = await getSessionUser();
    if (!user) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const contactEnrichmentId = fromGlobalId(gqlContactEnrichmentId).id;

    const profile = await getProfileByContactEnrichmentId(contactEnrichmentId);

    if (!profile || profile.userId !== user.id) {
      throw new GraphQLError(ERRORS.FORBIDDEN);
    }

    await updateContactEnrichment(contactEnrichmentId, {
      hiddenFields: input,
      approved,
    });

    const existingContactEnrichment =
      await getContactEnrichmentById(contactEnrichmentId);

    return {
      contactEnrichment: existingContactEnrichment,
    };
  };
