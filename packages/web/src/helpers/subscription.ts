import { revalidatePath } from 'next/cache';
import {
  activeUserSubscription,
  getCardModulesByWebCard,
  getUserProfilesWithWebCard,
  transaction,
  updateWebCard,
} from '@azzapp/data';
import { webCardRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import type { UserSubscription, WebCard } from '@azzapp/data';

export const unpublishWebCardForUser = async ({
  userId,
  userSubscription,
  forceUnpublishUser = false,
}: {
  userId: string;
  userSubscription?: UserSubscription;
  forceUnpublishUser?: boolean; // force unpublish even if user is premium (in case of missing seat when moving subscirption with IAP)
}) => {
  await transaction(async () => {
    const profiles = (await getUserProfilesWithWebCard(userId)).filter(
      ({ profile }) => profile.profileRole === 'owner',
    );

    const userIsPremium = (await activeUserSubscription([userId])).length > 0;

    for (let index = 0; index < profiles.length; index++) {
      const webCard = profiles[index].webCard;
      if (!userIsPremium || forceUnpublishUser) {
        if (webCard?.cardIsPublished) {
          const modules = await getCardModulesByWebCard(webCard.id, false);
          if (webCardRequiresSubscription(modules, webCard)) {
            const currentDate = new Date();
            //unpublished webCard
            const updates: Partial<WebCard> = {
              cardIsPublished: false,
              updatedAt: currentDate,
              lastCardUpdate: currentDate,
            };
            await updateWebCard(webCard.id, updates);
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
        await updateWebCard(webCard.id, updates);
        revalidatePath(`/${webCard.userName}`);
      }
    }
  });
};
