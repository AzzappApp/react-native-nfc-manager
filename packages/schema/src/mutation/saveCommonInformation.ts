import { GraphQLError } from 'graphql';
import {
  referencesMedias,
  transaction,
  updateWebCard,
  updateWebCardProfiles,
} from '@azzapp/data';
import { checkMedias } from '@azzapp/service/mediaServices/mediaServices';
import ERRORS from '@azzapp/shared/errors';
import { filterSocialLink } from '@azzapp/shared/socialLinkHelpers';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { notifyRelatedWalletPasses } from '#helpers/webCardHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const checkCommonInformationsUpdate = (data: Partial<WebCard>) => {
  if (data.bannerId || data.logoId) {
    return true;
  }
  if (data.commonInformation) {
    return Object.entries(data.commonInformation).some(([, value]) =>
      Array.isArray(value) ? value.length > 0 : !!value,
    );
  }
};

const saveCommonInformation: MutationResolvers['saveCommonInformation'] =
  async (
    _,
    { webCardId: gqlWebCardId, input: { logoId, bannerId, socials, ...data } },
  ) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    await checkWebCardProfileAdminRight(webCardId);

    const webCard = await webCardLoader.load(webCardId);

    if (!webCard) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    let updates: Partial<WebCard> = {
      commonInformation: { ...data, socials: filterSocialLink(socials) },
      logoId,
      bannerId,
    };

    if (checkCommonInformationsUpdate(updates) && !webCard.isMultiUser) {
      updates = {
        ...updates,
        isMultiUser: true,
      };
    }

    try {
      const addedMedia = [logoId, bannerId].filter(mediaId => mediaId != null);
      await checkMedias(addedMedia);
      await transaction(async () => {
        await updateWebCard(webCardId, updates);

        await updateWebCardProfiles(webCardId, {
          lastContactCardUpdate: new Date(),
        });

        await referencesMedias(addedMedia, [webCard.logoId, webCard.bannerId]);
      });

      await notifyRelatedWalletPasses(webCardId);
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return {
      webCard: {
        ...webCard,
        ...updates,
      },
    };
  };

export default saveCommonInformation;
