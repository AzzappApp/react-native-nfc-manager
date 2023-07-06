/* eslint-disable @typescript-eslint/ban-ts-comment */
import { omit } from 'lodash';
import { getProfileId } from '@azzapp/auth/viewer';
import {
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  SIMPLE_TEXT_DEFAULT_VALUES,
  SIMPLE_TITLE_DEFAULT_VALUES,
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

const saveSimpleTextModule: MutationResolvers['saveSimpleTextModule'] = async (
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
    console.log(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (!card) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  if (
    input.kind !== MODULE_KIND_SIMPLE_TEXT &&
    input.kind !== MODULE_KIND_SIMPLE_TITLE
  ) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  let module: CardModule | null = null;
  if (input.moduleId == null) {
    if (!input.text) {
      throw new Error(ERRORS.INVALID_REQUEST);
    }
  } else {
    try {
      [module] = await getCardModulesByIds([input.moduleId]);
    } catch (e) {
      console.log(e);
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!module || module.kind !== input.kind || module.cardId !== card.id) {
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
        kind: input.kind,
        position: await getCardModuleCount(card.id),
        data: {
          ...(input.kind === 'simpleText'
            ? SIMPLE_TEXT_DEFAULT_VALUES
            : SIMPLE_TITLE_DEFAULT_VALUES),
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

export default saveSimpleTextModule;
