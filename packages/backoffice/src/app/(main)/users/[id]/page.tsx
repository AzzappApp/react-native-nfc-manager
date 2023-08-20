import { notFound } from 'next/navigation';
import { getUsersByIds } from '@azzapp/data/domains';
import UserForm from './UserForm';

type UserPageProps = {
  params: {
    id: string;
  };
};

const UserPage = async ({ params: { id } }: UserPageProps) => {
  const [user] = await getUsersByIds([id]);
  if (!user) {
    return notFound();
  }

  return <UserForm user={user} />;
};

export default UserPage;
