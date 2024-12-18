import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { getSessionInfos } from '#GraphQLContext';
import { labelLoader } from '#loaders';

export const labelResolver = async <T extends { id: string }>(
  { id }: T,
  _: unknown,
) => {
  const { locale } = getSessionInfos();
  let label = await labelLoader.load([id, locale]);
  if (!label) {
    label = await labelLoader.load([id, DEFAULT_LOCALE]);
  }
  return label?.value ?? '';
};

export const labelResolverWithPrefix = (prefix: string) => {
  return async <T extends { id: string }>({ id }: T, _: unknown) => {
    const { locale } = getSessionInfos();
    let label = await labelLoader.load([prefix + id, locale]);
    if (!label) {
      label = await labelLoader.load([prefix + id, DEFAULT_LOCALE]);
    }
    return label?.value ?? '';
  };
};
