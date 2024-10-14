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
import { sendPushNotification } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader, userLoader } from '#loaders';
import type { MutationResolvers } from '#__generated__/types';
import type { Contact } from '@azzapp/data';

const addContact: MutationResolvers['addContact'] = async (
  _,
  { profileId: gqlProfileId, input },
) => {
  const { userId } = getSessionInfos();

  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profileId = fromGlobalId(gqlProfileId).id;
  const user = await userLoader.load(userId);
  const profile = await profileLoader.load(profileId);

  if (!profile || profile.userId !== userId) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  const existingContact = await getContactByProfiles({
    owner: profileId,
    contact: input.profileId,
  });

  const contactToCreate: Omit<Contact, 'createdAt' | 'deletedAt' | 'id'> = {
    addresses: input.addresses,
    contactProfileId: input.profileId,
    emails: input.emails,
    ownerProfileId: profileId,
    phoneNumbers: input.phoneNumbers,
    type: 'contact',
    birthday: input.birthday,
    company: input.company,
    firstName: input.firstname,
    lastName: input.lastname,
    title: input.title,
    deleted: false,
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
      createdAt: new Date(),
      deletedAt: null,
      ...contactToCreate,
    };
  }

  if (input.withShareBack) {
    const existingShareBack = await getContactByProfiles({
      owner: input.profileId,
      contact: profileId,
    });

    if (!existingShareBack) {
      const addresses = profile.contactCard?.addresses
        ?.filter(address => address.selected)
        .map(address => ({
          label: address.label,
          address: address.address,
        }));

      const emails = profile.contactCard?.emails
        ?.filter(email => email.selected)
        .map(email => ({
          label: email.label,
          address: email.address,
        }));

      const phoneNumbers = profile.contactCard?.phoneNumbers
        ?.filter(phoneNumber => phoneNumber.selected)
        .map(phoneNumber => ({
          label: phoneNumber.label,
          number: phoneNumber.number,
        }));

      const birthday = profile.contactCard?.birthday?.selected
        ? new Date(profile.contactCard.birthday.birthday)
        : null;

      await transaction(async () => {
        await createContact({
          ownerProfileId: input.profileId,
          contactProfileId: profileId,
          createdAt: new Date(),
          type: 'shareback',
          addresses: addresses ?? [],
          emails: emails ?? [],
          phoneNumbers: phoneNumbers ?? [],
          birthday,
          company: profile.contactCard?.company ?? undefined,
          firstName: profile.contactCard?.firstName ?? undefined,
          lastName: profile.contactCard?.lastName ?? undefined,
          title: profile.contactCard?.title ?? undefined,
        });

        await incrementShareBacksTotal(input.profileId);
        await incrementShareBacks(input.profileId, true);
      });

      await sendPushNotification(profile.userId, {
        type: 'shareBack',
        mediaId: null,
        sound: 'default',
        deepLink: 'shareBack',
        locale: guessLocale(user?.locale),
      });
    }
  }

  return {
    contact,
  };
};

export default addContact;
