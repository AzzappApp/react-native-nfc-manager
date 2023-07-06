import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import {
  buildDefaultContactCard,
  createContactCard,
  getContactCard,
  updateContactCard,
} from '#domains/contactCards';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveContactCard: MutationResolvers['saveContactCard'] = async (
  _,
  { input },
  { auth, profileLoader, userLoader, cardUpdateListener },
) => {
  const profileId = getProfileId(auth);

  if (!profileId) throw new Error('No profile id found');

  const existingCard = await getContactCard(profileId);

  if (existingCard) {
    const updatedCard = { ...existingCard, ...input };

    await updateContactCard(updatedCard);

    return { contactCard: updatedCard };
  } else {
    const profile = await profileLoader.load(profileId);
    if (!profile) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    const user = await userLoader.load(profile.userId);
    if (!user) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    const defaultCard = buildDefaultContactCard(profile, user);

    const newCard = {
      ...defaultCard,
      ...input,
    };

    const newCardWithDefaultValues = {
      ...newCard,
      firstName: newCard.firstName ?? null,
      lastName: newCard.lastName ?? null,
      title: newCard.title ?? null,
      company: newCard.company ?? null,
      emails: newCard.emails ?? null,
      phoneNumbers: newCard.phoneNumbers ?? null,
      backgroundStyle: newCard.backgroundStyle ?? {
        backgroundColor: '#000000',
      },
      public: newCard.public ?? false,
      isDisplayedOnWebCard: newCard.isDisplayedOnWebCard ?? false,
      profileId,
    };

    await createContactCard(newCardWithDefaultValues);

    cardUpdateListener(profile.userName);

    return { contactCard: newCardWithDefaultValues };
  }
};

export default saveContactCard;
