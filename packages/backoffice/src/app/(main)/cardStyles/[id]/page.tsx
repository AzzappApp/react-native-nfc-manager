import { notFound } from 'next/navigation';
import { getCardStyleById } from '@azzapp/data';
import CardStyleForm from '../CardStyleForm';

type CardStylePageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    saved?: string;
  };
};

const CardStylePage = async ({
  params: { id },
  searchParams,
}: CardStylePageProps) => {
  const cardStyle = await getCardStyleById(id);
  if (!cardStyle) {
    return notFound();
  }
  return <CardStyleForm cardStyle={cardStyle} saved={!!searchParams?.saved} />;
};

export default CardStylePage;
