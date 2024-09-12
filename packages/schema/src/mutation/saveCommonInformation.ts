import { GraphQLError } from 'graphql';
import {
  checkMedias,
  referencesMedias,
  transaction,
  updateWebCard,
  updateWebCardProfiles,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const saveCommonInformation: MutationResolvers['saveCommonInformation'] =
  async (_, { webCardId: gqlWebCardId, input: { logoId, ...data } }) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    await checkWebCardProfileAdminRight(webCardId);

    const webCard = await webCardLoader.load(webCardId);

    if (!webCard) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const updates: Partial<WebCard> = {
      commonInformation: data,
      logoId,
    };
    try {
      if (logoId) {
        await checkMedias([logoId]);
      }
      await transaction(async () => {
        await updateWebCard(webCardId, updates);

        await updateWebCardProfiles(webCardId, {
          lastContactCardUpdate: new Date(),
        });

        await referencesMedias(logoId ? [logoId] : [], [webCard.logoId]);
      });
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
