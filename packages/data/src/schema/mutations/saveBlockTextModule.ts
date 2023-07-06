/* eslint-disable @typescript-eslint/ban-ts-comment */
import { omit } from 'lodash';
import { getProfileId } from '@azzapp/auth/viewer';
import {
  BLOCK_TEXT_DEFAULT_VALUES,
  MODULE_KIND_BLOCK_TEXT,
} from '@azzapp/shared/cardModuleHelpers';
import ERRORS from '@azzapp/shared/errors';
import {
  createCardModule,
  getCardModuleCount,
  getCardModulesByIds,
  updateCardModule,
} from '#domains';
import type { Card, CardModule } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveBlockTextModule: MutationResolvers['saveBlockTextModule'] = async (
  _,
  { input },
  { auth, cardByProfileLoader, profileLoader, cardUpdateListener },
) => {
  const profileId = getProfileId(auth);
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  let card: Card | null;
  try {
    card = await cardByProfileLoader.load(profileId);
  } catch (e) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (!card) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  let module: CardModule | null = null;
  if (input.moduleId) {
    try {
      [module] = await getCardModulesByIds([input.moduleId]);
    } catch (e) {
      console.log(e);
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!module || module.cardId !== card.id) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }
  }

  try {
    if (module) {
      await updateCardModule(module.id, {
        data: { ...(module.data as object), ...omit(input, 'moduleId') },
      });
    } else {
      await createCardModule({
        cardId: card.id,
        kind: MODULE_KIND_BLOCK_TEXT,
        position: await getCardModuleCount(card.id),
        data: {
          ...BLOCK_TEXT_DEFAULT_VALUES,
          ...omit(input, 'moduleId'),
        },
        visible: true,
      });
    }
  } catch (e) {
    console.log(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  const profile = await profileLoader.load(profileId);
  cardUpdateListener(profile!.userName);

  return { card };
};

export default saveBlockTextModule;
