import { notFound } from 'next/navigation';
import { getUserById } from '@azzapp/data/domains';
import UserForm from './UserForm';

type UserPageProps = {
  params: {
    id: string;
  };
};

const UserPage = async ({ params: { id } }: UserPageProps) => {
  const user = await getUserById(id);
  if (!user) {
    return notFound();
  }

  return <UserForm user={user} />;
};

export default UserPage;
