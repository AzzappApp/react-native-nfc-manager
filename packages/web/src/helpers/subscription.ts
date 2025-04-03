import { revalidatePath } from 'next/cache';
import {
  getUserProfilesWithWebCard,
  getUserSubscriptions,
  transaction,
  updateWebCard,
} from '@azzapp/data';
import { webCardRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import type { WebCard } from '@azzapp/data';

export const unpublishWebCardForUser = async ({
  userId,
  forceUnpublishUser = false,
}: {
  userId: string;
  forceUnpublishUser?: boolean; // force unpublish even if user is premium (in case of missing seat when moving subscirption with IAP)
}) => {
  await transaction(async () => {
    const profiles = (await getUserProfilesWithWebCard(userId)).filter(
      ({ profile }) => profile.profileRole === 'owner',
    );

    const userIsPremium =
      (await getUserSubscriptions({ userIds: [userId], onlyActive: true }))
        .length > 0;
    for (const { webCard, profile } of profiles) {
      if (!userIsPremium || forceUnpublishUser) {
        if (webCard?.cardIsPublished) {
          if (
            profiles.length > 2 ||
            webCardRequiresSubscription(webCard) ||
            profile.contactCard?.company ||
            profile.contactCard?.urls?.length
          ) {
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
      }
    }
  });
};
