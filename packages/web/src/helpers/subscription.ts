import { revalidatePath } from 'next/cache';
import {
  getUserProfilesWithWebCard,
  getUserSubscriptions,
  transaction,
  updateWebCard,
} from '@azzapp/data';
import { shouldUnpublishWebCard } from '@azzapp/shared/subscriptionHelpers';
import type { WebCard } from '@azzapp/data';

export const unpublishWebCardForUser = async ({
  userId,
}: {
  userId: string;
}) => {
  await transaction(async () => {
    const profiles = (await getUserProfilesWithWebCard(userId)).filter(
      ({ profile }) => profile.profileRole === 'owner',
    );

    const userIsPremium =
      (await getUserSubscriptions({ userIds: [userId], onlyActive: true }))
        .length > 0;
    if (!userIsPremium) {
      for (const { webCard, profile } of profiles) {
        if (
          shouldUnpublishWebCard({
            webCard,
            profile,
            nbProfiles: profiles.length,
          })
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
  });
};

/**
 * Unpublishes a web card for a user when they have no seats left
 * only if this is a multi user web card. in this case the user is still premium
 * @param userId - The ID of the user to unpublish the web card for
 */
export const unpublishWebCardForNoSeat = async ({
  userId,
}: {
  userId: string;
}) => {
  await transaction(async () => {
    const profiles = (await getUserProfilesWithWebCard(userId)).filter(
      ({ profile }) => profile.profileRole === 'owner',
    );

    for (const { webCard } of profiles) {
      if (webCard.isMultiUser) {
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
  });
};
