import { GraphQLError } from 'graphql';
import { fromGlobalId, toGlobalId } from 'graphql-relay';

import {
  checkMedias,
  createContact,
  getContactByProfiles,
  incrementShareBacks,
  incrementShareBacksTotal,
  referencesMedias,
  transaction,
  updateContact,
} from '@azzapp/data';
import { guessLocale } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import { isDefined } from '@azzapp/shared/isDefined';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { notifyUsers, sendPushNotification } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader, userLoader, webCardLoader } from '#loaders';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#__generated__/types';
import type { Contact, ContactRow } from '@azzapp/data';

const addContact: MutationResolvers['addContact'] = async (
  _,
  { profileId: gqlProfileId, input, notify, scanUsed, location, address },
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
  const webCard = await webCardLoader.load(profile.webCardId);

  const existingContact = input.profileId
    ? await getContactByProfiles({
        owner: profileId,
        contact: input.profileId,
      })
    : null;

  const data = [input.avatarId, input.logoId].filter(isDefined);
  if (data.length) {
    await checkMedias(data);
    await referencesMedias(data, null);
  }

  const contactToCreate: Omit<Contact, 'deletedAt' | 'id'> = {
    avatarId: input.avatarId ?? null,
    addresses: input.addresses,
    contactProfileId: input.profileId ?? null,
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
    logoId: input.logoId ?? null,
    meetingLocation: location ?? null,
    meetingPlace: address ?? null,
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

  if (scanUsed) {
    await validateCurrentSubscription(userId, {
      action: 'ADD_CONTACT_WITH_SCAN',
    });
  }

  if (input.withShareBack && input.profileId) {
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

    const birthday =
      profile.contactCard?.birthday?.birthday &&
      profile.contactCard?.birthday.selected
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
      meetingLocation: location ?? null,
      meetingPlace: address ?? null,
    };

    const existingShareBack = await getContactByProfiles({
      owner: input.profileId,
      contact: profileId,
    });

    const inputProfileId = input.profileId;

    if (inputProfileId) {
      if (!existingShareBack) {
        await transaction(async () => {
          await createContact(shareBackToCreate);
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

    const profileToNotify = await profileLoader.load(input.profileId);

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

  if (notify && input.emails.length > 0 && webCard) {
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
          firstname: input.firstname,
          lastname: input.lastname,
        },
      },
    );
  }

  return {
    contact,
  };
};

export default addContact;
