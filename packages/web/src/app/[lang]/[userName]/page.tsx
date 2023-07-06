import { unstable_cache } from 'next/cache';
import { notFound } from 'next/navigation';
import {
  getCardCoversByIds,
  getCardModules,
  getProfileByUserName,
  getUsersCards,
} from '@azzapp/data/domains';
import { CoverRenderer, ModuleRenderer } from '#components';
import DownloadVCard from './DownloadVCard';

type ProfilePageProps = {
  params: {
    userName: string;
  };
};

const ProfilePage = async ({ params: { userName } }: ProfilePageProps) => {
  const { profile, card, cover, modules } = await unstable_cache(
    async () => {
      const profile = await getProfileByUserName(userName);
      const [card] = profile ? await getUsersCards([profile.id]) : [];
      const [cover] = card ? await getCardCoversByIds([card.coverId]) : [];
      const modules = card ? await getCardModules(card.id) : [];

      return { profile, card, cover, modules };
    },
    [userName],
    { tags: [userName] },
  )();

  if (!profile || !card || !cover) {
    return notFound();
  }

  return (
    <div style={{ backgroundColor: card.backgroundColor ?? '#FFF' }}>
      <CoverRenderer cover={cover} />
      <div style={{ display: 'flex', flexDirection: 'column', width: '100vw' }}>
        {modules.map(module => (
          <ModuleRenderer module={module} key={module.id} />
        ))}
      </div>
      <DownloadVCard profileId={profile.id} userName={userName} />
    </div>
  );
};

export default ProfilePage;

export const dynamic = 'force-static';
