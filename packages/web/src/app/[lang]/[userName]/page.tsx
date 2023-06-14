import { notFound } from 'next/navigation';
import {
  getCardCoversByIds,
  getCardModules,
  getProfileByUserName,
  getUsersCards,
} from '@azzapp/data/domains';
import BlockTextRenderer from './BlockTextRenderer';
import CarouselRenderer from './CarouselRenderer';
import CoverRenderer from './CoverRenderer';
import HorizontalPhotoRenderer from './HorizontalPhotoRenderer';
import LineDividerRenderer from './LineDividerRenderer';
import PhotoWithTextAndTitleRenderer from './PhotoWithTextAndTitleRenderer';
import SimpleButtonRenderer from './SimpleButtonRenderer';
import { SimpleTextRenderer } from './SimpleTextRenderer';
import SocialLinksRenderer from './SocialLinksRenderer';

type ProfilePageProps = {
  params: {
    userName: string;
  };
};

const ProfilePage = async ({ params: { userName } }: ProfilePageProps) => {
  const profile = await getProfileByUserName(userName);
  const [card] = profile ? await getUsersCards([profile.id]) : [];
  const [cover] = card ? await getCardCoversByIds([card.coverId]) : [];
  if (!profile || !card || !cover) {
    return notFound();
  }

  const modules = await getCardModules(card.id);

  return (
    <div style={{ backgroundColor: card.backgroundColor ?? '#FFF' }}>
      <CoverRenderer cover={cover} />
      <div style={{ display: 'flex', flexDirection: 'column', width: '100vw' }}>
        {modules.map(module => {
          switch (module.kind) {
            case 'blockText':
              return <BlockTextRenderer module={module} key={module.id} />;
            case 'carousel':
              return <CarouselRenderer module={module} key={module.id} />;
            case 'horizontalPhoto':
              return (
                <HorizontalPhotoRenderer module={module} key={module.id} />
              );
            case 'lineDivider':
              return <LineDividerRenderer module={module} key={module.id} />;
            case 'photoWithTextAndTitle':
              return (
                <PhotoWithTextAndTitleRenderer
                  module={module}
                  key={module.id}
                />
              );
            case 'simpleButton':
              return <SimpleButtonRenderer module={module} key={module.id} />;
            case 'simpleTitle':
            case 'simpleText':
              return <SimpleTextRenderer module={module} key={module.id} />;
            case 'socialLinks':
              return <SocialLinksRenderer module={module} key={module.id} />;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};

export default ProfilePage;

export const dynamic = 'force-dynamic';
