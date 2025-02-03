import { GraphQLError } from 'graphql';
import isEqual from 'lodash/isEqual';
import { z } from 'zod';
import {
  getCardModulesByIds,
  type CardModule,
  checkMedias,
  referencesMedias,
  updateCardModule,
  createCardModule,
  getCardModulesByWebCard,
  transaction,
  getCardModuleNextPosition,
} from '@azzapp/data';
import {
  MODULE_KIND_BLOCK_TEXT,
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_MEDIA,
  MODULE_KIND_MEDIA_TEXT,
  MODULE_KIND_MEDIA_TEXT_LINK,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  MODULE_KIND_SIMPLE_BUTTON,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_SOCIAL_LINKS,
  MODULE_KIND_TITLE_TEXT,
} from '@azzapp/shared/cardModuleHelpers';
import ERRORS from '@azzapp/shared/errors';
import { changeModuleRequireSubscription } from '@azzapp/shared/subscriptionHelpers';
import { invalidateWebCard } from '#externals';
import {
  activeSubscriptionsForUserLoader,
  webCardLoader,
  webCardOwnerLoader,
} from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { ZodType } from 'zod';

const createModuleSavingMutation =
  <TModule extends CardModule>(moduleKind: TModule['kind']) =>
  async (
    _: unknown,
    {
      webCardId: gqlWebCardId,
      input: { moduleId, variant, ...data },
    }: {
      webCardId: string;
      input: TModule['data'] & {
        moduleId?: string | null;
        variant?: string | null;
      };
    },
  ) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    await checkWebCardProfileEditorRight(webCardId);

    let webCard = await webCardLoader.load(webCardId);
    if (!webCard) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    const modules = await getCardModulesByWebCard(webCardId);
    const moduleCount = modules.length + (moduleId ? 0 : 1);

    const owner = await webCardOwnerLoader.load(webCard.id);

    if (
      changeModuleRequireSubscription(moduleKind, moduleCount) &&
      webCard.cardIsPublished
    ) {
      const subscription = owner
        ? await activeSubscriptionsForUserLoader.load(owner.id)
        : null;
      if (!subscription) {
        throw new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED);
      }
    }

    const { validator, getMedias } = MODULES_SAVE_RULES[moduleKind] ?? {};

    let module: CardModule | null = null;
    let previousMedias: string[] | null = null;

    if (validator) {
      const { success } = validator.safeParse(data);
      if (!success) {
        throw new GraphQLError(ERRORS.INVALID_REQUEST);
      }
    }

    if (moduleId) {
      try {
        [module] = await getCardModulesByIds([moduleId]);
      } catch (e) {
        console.error(e);
        throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
      }
      if (
        !module ||
        module.webCardId !== webCardId ||
        module.kind !== moduleKind
      ) {
        throw new GraphQLError(ERRORS.INVALID_REQUEST);
      }
      previousMedias = getMedias?.(module.data as any) ?? null;
    }

    try {
      const newMedias = getMedias?.(data as any) ?? null;
      if (newMedias?.length) {
        await checkMedias(newMedias);
      }
      await transaction(async () => {
        if (newMedias && !isEqual(newMedias, previousMedias)) {
          await referencesMedias(newMedias, previousMedias);
        }
        if (module) {
          await updateCardModule(module.id, { data, variant });
        } else {
          await createCardModule({
            webCardId,
            kind: moduleKind,
            position: await getCardModuleNextPosition(webCardId),
            data,
            visible: true,
            variant,
          });
        }
      });
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    webCard = await webCardLoader.load(webCardId);
    if (!webCard) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (webCard.userName) {
      invalidateWebCard(webCard.userName);
    }
    return { webCard };
  };

export const MODULES_SAVE_RULES: {
  [TModule in CardModule as TModule['kind']]?: {
    validator: ZodType<Partial<TModule['data']>>;
    getMedias?: (module: TModule['data']) => string[] | null;
  };
} = {
  [MODULE_KIND_BLOCK_TEXT]: {
    validator: z.object({
      text: z.string().min(1),
    }),
  },
  [MODULE_KIND_CAROUSEL]: {
    validator: z.object({
      images: z.array(z.string()).min(1),
    }),
    getMedias: ({ images }: { images: string[] }) => images,
  },
  [MODULE_KIND_HORIZONTAL_PHOTO]: {
    validator: z.object({
      image: z.string(),
    }),
    getMedias: ({ image }: { image: string }) => (image ? [image] : null),
  },
  [MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE]: {
    validator: z
      .object({
        image: z.string(),
        content: z.string().min(1),
      })
      .or(
        z.object({
          image: z.string(),
          title: z.string().min(1),
        }),
      ),
    getMedias: ({ image }: { image: string }) => (image ? [image] : null),
  },
  [MODULE_KIND_SIMPLE_TEXT]: {
    validator: z.object({
      text: z.string().min(1),
    }),
  },
  [MODULE_KIND_SIMPLE_TITLE]: {
    validator: z.object({
      text: z.string().min(1),
    }),
  },
  [MODULE_KIND_SOCIAL_LINKS]: {
    validator: z.object({
      links: z.array(z.any()).min(1),
    }),
  },
  [MODULE_KIND_SIMPLE_BUTTON]: {
    validator: z.object({
      buttonLabel: z.string().min(1),
      // TODO better validation
      actionType: z.string().min(1),
      // TODO better validation
      actionLink: z.string().min(1),
    }),
  },
  [MODULE_KIND_MEDIA]: {
    validator: z.object({
      cardModuleMedias: z
        .array(z.object({ media: z.object({ id: z.string() }) }))
        .min(1),
    }),
    getMedias: (module: {
      cardModuleMedias: Array<{ media: { id: string } }>;
    }) => {
      const { cardModuleMedias } = module;
      return cardModuleMedias
        .map(mediaModules => mediaModules.media.id)
        .filter(n => n !== null);
    },
  },
  [MODULE_KIND_MEDIA_TEXT]: {
    validator: z.object({
      cardModuleMedias: z
        .array(
          z.object({
            media: z.object({ id: z.string() }),
          }),
        )
        .min(1),
    }),
    getMedias: (module: {
      cardModuleMedias: Array<{ media: { id: string } }>;
    }) => {
      const { cardModuleMedias } = module;
      return cardModuleMedias
        .map(mediaModules => mediaModules.media.id)
        .filter(n => n !== null);
    },
  },
  [MODULE_KIND_MEDIA_TEXT_LINK]: {
    validator: z.object({
      cardModuleMedias: z
        .array(
          z.object({
            media: z.object({ id: z.string() }),
          }),
        )
        .min(1),
    }),
    getMedias: (module: {
      cardModuleMedias: Array<{ media: { id: string } }>;
    }) => {
      const { cardModuleMedias } = module;
      return cardModuleMedias
        .map(mediaModules => mediaModules.media.id)
        .filter(n => n !== null);
    },
  },
};

export const saveBlockTextModule: MutationResolvers['saveBlockTextModule'] =
  createModuleSavingMutation(MODULE_KIND_BLOCK_TEXT);

export const saveCarouselModule: MutationResolvers['saveCarouselModule'] =
  createModuleSavingMutation(MODULE_KIND_CAROUSEL);

export const saveHorizontalPhotoModule: MutationResolvers['saveHorizontalPhotoModule'] =
  createModuleSavingMutation(MODULE_KIND_HORIZONTAL_PHOTO);

export const savePhotoWithTextAndTitleModule: MutationResolvers['savePhotoWithTextAndTitleModule'] =
  createModuleSavingMutation(MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE);

export const saveLineDividerModule: MutationResolvers['saveLineDividerModule'] =
  createModuleSavingMutation(MODULE_KIND_LINE_DIVIDER);

export const saveSimpleTextModule: MutationResolvers['saveSimpleTextModule'] = (
  parent,
  { webCardId, input: { kind, ...rest } },
) => {
  if (kind !== MODULE_KIND_SIMPLE_TEXT && kind !== MODULE_KIND_SIMPLE_TITLE) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  return createModuleSavingMutation(kind)(parent, { webCardId, input: rest });
};

export const saveSimpleButtonModule: MutationResolvers['saveSimpleButtonModule'] =
  createModuleSavingMutation(MODULE_KIND_SIMPLE_BUTTON);

export const saveSocialLinksModule: MutationResolvers['saveSocialLinksModule'] =
  createModuleSavingMutation(MODULE_KIND_SOCIAL_LINKS);

export const saveMediaModule: MutationResolvers['saveMediaModule'] =
  createModuleSavingMutation(MODULE_KIND_MEDIA);

export const saveMediaTextModule: MutationResolvers['saveMediaTextModule'] =
  createModuleSavingMutation(MODULE_KIND_MEDIA_TEXT);

export const saveMediaTextLinkModule: MutationResolvers['saveMediaTextLinkModule'] =
  createModuleSavingMutation(MODULE_KIND_MEDIA_TEXT_LINK);

export const saveTitleTextModule: MutationResolvers['saveTitleTextModule'] =
  createModuleSavingMutation(MODULE_KIND_TITLE_TEXT);

//INSERT_MODULE
