import createPost from './createPost';
import createPostComment from './createPostComment';
import deleteModules from './deleteModules';
import duplicateModule from './duplicateModule';
import togglePostReaction from './postReaction';
import removeFollower from './removeFollower';
import saveCarouselModule from './saveCarouselModule';
import saveHorizontalPhotoModule from './saveHorizontalPhotoModule';
import saveLineDividerModule from './saveLineDividerModule';
import savePhotoWithTextAndTitleModule from './savePhotoWithTextAndTitleModule';
import saveSimpleButtonModule from './saveSimpleButtonModule';
import saveSimpleTextModule from './saveSimpleTextModule';
import swapModules from './swapModules';
import toggleFollowing from './toggleFollowing';
import updateCard from './updateCard';
import updateCover from './updateCover';
import updateModulesVisibility from './updateModulesVisibility';
import updateProfile from './updateProfile';
import updateUser from './updateUser';
import type {
  MutationResolvers,
  Resolver,
  ResolverFn,
} from '#schema/__generated__/types';

const createMutationWithClientMutationId = <
  TResult extends
    | Promise<{ clientMutationId?: string | null } | null>
    | { clientMutationId?: string | null }
    | null,
  TParent,
  TContext,
  TArgs extends { input: { clientMutationId?: string | null } },
>(
  fn?: Resolver<TResult, TParent, TContext, TArgs>,
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
): Resolver<TResult, TParent, TContext, TArgs> | undefined => {
  if (fn) {
    const res: ResolverFn<TResult, TParent, TContext, TArgs> = async (
      parent,
      args,
      context,
      info,
    ) => {
      const { clientMutationId } = args.input;
      const result =
        typeof fn === 'function'
          ? await fn(parent, args, context, info)
          : await fn.resolve(parent, args, context, info);
      return result ? { ...result, clientMutationId } : (null as TResult);
    };

    return typeof fn === 'function' ? res : { ...fn, resolve: res };
  }
  return fn;
};

export const Mutation: MutationResolvers = {
  updateProfile: createMutationWithClientMutationId(updateProfile),
  updateUser: createMutationWithClientMutationId(updateUser),
  updateCover: createMutationWithClientMutationId(updateCover),
  createPost: createMutationWithClientMutationId(createPost),
  toggleFollowing: createMutationWithClientMutationId(toggleFollowing),
  removeFollower: createMutationWithClientMutationId(removeFollower),
  togglePostReaction: createMutationWithClientMutationId(togglePostReaction),
  saveSimpleTextModule:
    createMutationWithClientMutationId(saveSimpleTextModule),
  saveLineDividerModule: createMutationWithClientMutationId(
    saveLineDividerModule,
  ),
  saveHorizontalPhotoModule: createMutationWithClientMutationId(
    saveHorizontalPhotoModule,
  ),
  saveCarouselModule: createMutationWithClientMutationId(saveCarouselModule),
  savePhotoWithTextAndTitleModule: createMutationWithClientMutationId(
    savePhotoWithTextAndTitleModule,
  ),
  updateCard: createMutationWithClientMutationId(updateCard),
  saveSimpleButtonModule: createMutationWithClientMutationId(
    saveSimpleButtonModule,
  ),
  swapModules: createMutationWithClientMutationId(swapModules),
  deleteModules: createMutationWithClientMutationId(deleteModules),
  duplicateModule: createMutationWithClientMutationId(duplicateModule),
  updateModulesVisibility: createMutationWithClientMutationId(
    updateModulesVisibility,
  ),
  createPostComment: createMutationWithClientMutationId(createPostComment),
};
