import { unfollows } from '@azzapp/data';
import { CannotAccessWebCardException } from './exceptions';
import type { Loaders } from '#GraphQLContext';

type Executable<Input, Output> = {
  execute(input: Input): Promise<Output>;
};

type Input = {
  webCardId: string;
  removedFollowerId: string;
  loaders: Loaders;
};

export type RemoveFollowerUseCase = Executable<Input, void>;

export const removeFollower = async (input: Input) => {
  const webCard = await input.loaders.WebCard.load(input.webCardId);
  if (!webCard?.cardIsPrivate) {
    throw new CannotAccessWebCardException();
  }

  await unfollows(input.removedFollowerId, input.webCardId);
};
