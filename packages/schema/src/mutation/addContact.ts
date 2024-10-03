import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';

import {
  createContact,
  getContactByProfiles,
  updateContact,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader } from '#loaders';
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

  const profile = await profileLoader.load(profileId);

  if (!profile || profile.userId !== userId) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  const existingContact = await getContactByProfiles({
    owner: profileId,
    contact: input.profileId,
  });

  const contactToCreate: Omit<Contact, 'createdAt' | 'deviceIds' | 'id'> = {
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
  };

  let contact: Contact;

  if (existingContact) {
    const deviceIds = [...existingContact.deviceIds];

    if (!existingContact.deviceIds.includes(input.deviceId)) {
      deviceIds.push(input.deviceId);
    }

    await updateContact(existingContact.id, {
      ...contactToCreate,
      deviceIds,
    });

    contact = {
      ...existingContact,
      ...contactToCreate,
      deviceIds,
    };
  } else {
    const id = await createContact({
      ...contactToCreate,
      deviceIds: [input.deviceId],
    });

    contact = {
      id,
      createdAt: new Date(),
      deviceIds: [input.deviceId],
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

      await createContact({
        ownerProfileId: input.profileId,
        contactProfileId: profileId,
        createdAt: new Date(),
        type: 'shareback',
        deviceIds: [],
        addresses: addresses ?? [],
        emails: emails ?? [],
        phoneNumbers: phoneNumbers ?? [],
        birthday,
        company: profile.contactCard?.company ?? undefined,
        firstName: profile.contactCard?.firstName ?? undefined,
        lastName: profile.contactCard?.lastName ?? undefined,
        title: profile.contactCard?.title ?? undefined,
      });
    }
  }

  return {
    contact,
  };
};

export default addContact;
