import UserWebScreenUserQueryNode from '@azzapp/relay/artifacts/UserWebScreenUserQuery.graphql';
import { notFound } from 'next/navigation';
import preloadServerQuery from '../../../helpers/preloadServerQuery';
import UserWebScreen from './UserWebScreen';
import type { UserWebScreenUserQuery } from '@azzapp/relay/artifacts/UserWebScreenUserQuery.graphql';

export type UserPageProps = {
  params: { userName: string };
};

const UserPage = async ({ params: { userName } }: UserPageProps) => {
  const serverQuery = await preloadServerQuery<UserWebScreenUserQuery>(
    UserWebScreenUserQueryNode,
    { userName },
  );

  if (!serverQuery.response.user) {
    return notFound();
  }

  return <UserWebScreen serverQuery={serverQuery} />;
};

export default UserPage;

export const dynamic = 'force-static';

export const revalidate = 10;
