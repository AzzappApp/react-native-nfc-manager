import { revalidatePath } from 'next/cache';
import {
  activeUserSubscription,
  db,
  getCardModules,
  getProfilesOfUserForRole,
  updateWebCard,
} from '@azzapp/data';
import { webCardRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import type { UserSubscription, WebCard } from '@azzapp/data';
import type { DbTransaction } from '@azzapp/data/db';

export const unpublishWebCardForUser = async (
  userId: string,
  userSubscription?: UserSubscription,
  trx: DbTransaction = db,
) => {
  const profiles = await getProfilesOfUserForRole(userId, 'owner');

  const userIsPremium = (await activeUserSubscription([userId])).length > 0;

  for (let index = 0; index < profiles.length; index++) {
    const webCard = profiles[index].WebCard;
    if (!userIsPremium) {
      if (webCard?.cardIsPublished) {
        const modules = await getCardModules(webCard.id, false, trx);
        if (webCardRequiresSubscription(modules, webCard)) {
          const currentDate = new Date();
          //unpublished webCard
          const updates: Partial<WebCard> = {
            cardIsPublished: false,
            updatedAt: currentDate,
            lastCardUpdate: currentDate,
          };
          await updateWebCard(webCard.id, updates, trx);
          revalidatePath(`/${webCard.userName}`);
        }
      }
    } else if (
      userSubscription?.webCardId === webCard.id &&
      webCard.isMultiUser
    ) {
      const currentDate = new Date();
      const updates: Partial<WebCard> = {
        cardIsPublished: false,
        updatedAt: currentDate,
        lastCardUpdate: currentDate,
      };
      await updateWebCard(webCard.id, updates, trx);
      revalidatePath(`/${webCard.userName}`);
    }
  }
};
