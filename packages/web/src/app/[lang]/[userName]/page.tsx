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
} from '@azzapp/shared/cardHelpers';
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
    />
  );
};

export default ProfilePage;

export const dynamic = 'force-static';
