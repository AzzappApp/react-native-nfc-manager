import { notFound } from 'next/navigation';
import ProfileWebSCreenQueryNode from '@azzapp/relay/artifacts/ProfileWebScreenQuery.graphql';
import preloadServerQuery from '#helpers/preloadServerQuery';
import UserWebScreen from './ProfileWebScreen';
import type { ProfileWebScreenQuery } from '@azzapp/relay/artifacts/ProfileWebScreenQuery.graphql';

export type UserPageProps = {
  params: { userName: string };
};

const ProfilePage = async ({ params: { userName } }: UserPageProps) => {
  const serverQuery = await preloadServerQuery<ProfileWebScreenQuery>(
    ProfileWebSCreenQueryNode,
    { userName },
  );

  if (!serverQuery.response.profile) {
    return notFound();
  }

  return <UserWebScreen serverQuery={serverQuery} />;
};

export default ProfilePage;

export const dynamic = 'force-static';

export const revalidate = 10;
