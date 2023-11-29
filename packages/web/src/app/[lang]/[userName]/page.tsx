import { capitalize } from 'lodash';
import { unstable_cache } from 'next/cache';
import { notFound } from 'next/navigation';
import {
  getCardModules,
  getMediasByIds,
  getProfilesPostsWithTopComment,
  getStaticMediasByIds,
  getWebCardByUserName,
} from '@azzapp/data/domains';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  DEFAULT_CARD_STYLE,
  DEFAULT_COLOR_PALETTE,
  swapColor,
} from '@azzapp/shared/cardHelpers';
import {
  MODULES_DEFAULT_VALUES,
  MODULES_STYLES_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import { CoverRenderer, ModuleRenderer } from '#components';
import { getMetaData } from '#helpers/seo';
import WebCardPageLayout from './WebCardPageLayout';
import type { Metadata } from 'next';

type ProfilePageProps = {
  params: {
    userName: string;
  };
};

const ProfilePage = async ({ params: { userName } }: ProfilePageProps) => {
  const { webCard, modules, media, posts, backgrounds } = await unstable_cache(
    async () => {
      console.info(`Caching webcard for user ${userName}`);

      const webCard = await getWebCardByUserName(userName);

      try {
        if (webCard?.cardIsPublished) {
          const [posts, modules, media] = await Promise.all([
            getProfilesPostsWithTopComment(webCard.id, 5, 0),
            getCardModules(webCard.id),
            webCard.coverData?.mediaId
              ? getMediasByIds([webCard.coverData.mediaId]).then(
                  ([media]) => media,
                )
              : null,
          ]);

          const backgroundIds = convertToNonNullArray(
            modules.map(module => (module.data as any).backgroundId),
          );

          const backgrounds = backgroundIds.length
            ? await getStaticMediasByIds(backgroundIds)
            : [];

          return {
            webCard,
            modules,
            media,
            posts,
            backgrounds,
          };
        }
      } catch (e) {
        console.error(e);
      }

      return {
        webCard,
        card: undefined,
        cover: undefined,
        modules: [],
        media: undefined,
        posts: [],
        postsCount: 0,
        backgrounds: [],
      };
    },
    [userName],
    { tags: [userName] },
  )();

  if (!webCard?.cardIsPublished || !media) {
    return notFound();
  }

  const resizeModes = new Map(
    convertToNonNullArray(backgrounds).map(b => [b.id, b.resizeMode!]),
  );

  const cardColors = webCard.cardColors ?? DEFAULT_COLOR_PALETTE;

  const cardBackgroundColor = swapColor(
    webCard.coverData?.backgroundColor ?? cardColors.light,
    cardColors,
  );
  let lastModuleBackgroundColor = cardBackgroundColor;
  const lastModule = modules.at(-1);

  if (lastModule) {
    const lastModuleData = getModuleDataValues({
      data: lastModule.data as any,
      cardStyle: webCard.cardStyle ?? DEFAULT_CARD_STYLE,
      defaultValues: MODULES_DEFAULT_VALUES[lastModule.kind],
      styleValuesMap: MODULES_STYLES_VALUES[lastModule.kind],
    });

    lastModuleBackgroundColor = swapColor(
      lastModuleData.backgroundStyle?.backgroundColor ??
        lastModuleData.colorBottom,
      cardColors,
    );
  }

  return (
    <WebCardPageLayout
      webCard={webCard}
      modules={
        <>
          {modules.map(module => (
            <ModuleRenderer
              resizeModes={resizeModes}
              module={module}
              key={module.id}
              colorPalette={webCard.cardColors ?? DEFAULT_COLOR_PALETTE}
              cardStyle={webCard.cardStyle ?? DEFAULT_CARD_STYLE}
            />
          ))}
        </>
      }
      posts={posts}
      media={media}
      cover={<CoverRenderer webCard={webCard} media={media} />}
      cardBackgroundColor={cardBackgroundColor}
      lastModuleBackgroundColor={lastModuleBackgroundColor}
    />
  );
};

export default ProfilePage;

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const imageUrl = `${process.env.NEXT_PUBLIC_URL}api/cover/${
    params.userName
  }?width=${1200}&height=${1200}&keepAspectRatio=left_pad`;

  const meta = getMetaData({
    url: params.userName,
    title: capitalize(params.userName),
    ogImage: imageUrl,
    description: `${params.userName} | Azzapp WebCard`,
  });
  return meta;
}

export const revalidate = 3600;
