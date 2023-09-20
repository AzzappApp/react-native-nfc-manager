import { unstable_cache } from 'next/cache';
import { notFound } from 'next/navigation';
import {
  getCardModules,
  getMediasByIds,
  getProfileByUserName,
  getProfilesPostsWithTopComment,
  getStaticMediasByIds,
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
import ProfilePageLayout from './ProfilePageLayout';

type ProfilePageProps = {
  params: {
    userName: string;
  };
};

const ProfilePage = async ({ params: { userName } }: ProfilePageProps) => {
  const { profile, modules, media, posts, backgrounds } = await unstable_cache(
    async () => {
      console.info(`Caching webcard for user ${userName}`);

      const profile = await getProfileByUserName(userName);

      try {
        if (profile?.cardIsPublished) {
          const [posts, modules, media] = await Promise.all([
            getProfilesPostsWithTopComment(profile.id, 5, 0),
            getCardModules(profile.id),
            profile.coverData?.mediaId
              ? getMediasByIds([profile.coverData.mediaId]).then(
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
            profile,
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
        profile,
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

  if (!profile?.cardIsPublished || !media) {
    return notFound();
  }

  const resizeModes = new Map(
    convertToNonNullArray(backgrounds).map(b => [b.id, b.resizeMode!]),
  );

  const cardColors = profile.cardColors ?? DEFAULT_COLOR_PALETTE;

  const cardBackgroundColor = swapColor(
    profile.coverData?.backgroundColor ?? cardColors.light,
    cardColors,
  );
  let lastModuleBackgroundColor = cardBackgroundColor;
  const lastModule = modules.at(-1);

  if (lastModule) {
    const lastModuleData = getModuleDataValues({
      data: lastModule.data as any,
      cardStyle: profile.cardStyle ?? DEFAULT_CARD_STYLE,
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
    <ProfilePageLayout
      profile={profile}
      modules={
        <>
          {modules.map(module => (
            <ModuleRenderer
              resizeModes={resizeModes}
              module={module}
              key={module.id}
              colorPalette={profile.cardColors ?? DEFAULT_COLOR_PALETTE}
              cardStyle={profile.cardStyle ?? DEFAULT_CARD_STYLE}
            />
          ))}
        </>
      }
      posts={posts}
      media={media}
      cover={<CoverRenderer profile={profile} media={media} />}
      cardBackgroundColor={cardBackgroundColor}
      lastModuleBackgroundColor={lastModuleBackgroundColor}
    />
  );
};

export default ProfilePage;

export const dynamic = 'force-static';

export const revalidate = 3600;
