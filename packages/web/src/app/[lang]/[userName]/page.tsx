import { unstable_cache } from 'next/cache';
import { notFound } from 'next/navigation';
import {
  getCardCoversByIds,
  getCardModules,
  getMediasByIds,
  getProfileByUserName,
  getProfilesPostsWithTopComment,
  getUsersCards,
  getProfilesPostsCount,
  getStaticMediasByIds,
} from '@azzapp/data/domains';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { CoverRenderer, ModuleRenderer } from '#components';
import ProfilePageLayout from './ProfilePageLayout';

type ProfilePageProps = {
  params: {
    userName: string;
  };
};

const ProfilePage = async ({ params: { userName } }: ProfilePageProps) => {
  const {
    profile,
    card,
    cover,
    modules,
    media,
    posts,
    postsCount,
    backgrounds,
  } = await unstable_cache(
    async () => {
      const profile = await getProfileByUserName(userName);

      try {
        if (profile) {
          const [[card], posts, postsCount] = await Promise.all([
            getUsersCards([profile.id]),
            getProfilesPostsWithTopComment(profile.id, 5, 0),
            getProfilesPostsCount(profile.id),
          ]);

          if (card) {
            const [[cover], modules] = await Promise.all([
              getCardCoversByIds([card.coverId]),
              getCardModules(card.id),
            ]);

            if (cover) {
              const [media] = await getMediasByIds([cover.mediaId]);
              const backgrounds = await getStaticMediasByIds(
                convertToNonNullArray(
                  modules.map(module => module.data.backgroundId),
                ),
              );

              return {
                profile,
                card,
                cover,
                modules,
                media,
                posts,
                postsCount,
                backgrounds,
              };
            }
          }
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

  if (!profile || !card || !cover || !media) {
    return notFound();
  }

  const resizeModes = new Map(
    convertToNonNullArray(backgrounds).map(b => [b.id, b.resizeMode!]),
  );

  return (
    <ProfilePageLayout
      card={card}
      profile={profile}
      modules={
        <>
          {modules.map(module => (
            <ModuleRenderer
              resizeModes={resizeModes}
              module={module}
              key={module.id}
            />
          ))}
        </>
      }
      posts={posts}
      postsCount={postsCount}
      media={media}
      cover={<CoverRenderer cover={cover} />}
    />
  );
};

export default ProfilePage;

export const dynamic = 'force-dynamic';
