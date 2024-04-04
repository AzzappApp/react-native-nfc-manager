import { notFound } from 'next/navigation';
import { getCardStyleById, getLabel } from '@azzapp/data';
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
  const label = await getLabel(cardStyle.labelKey);

  return (
    <CardStyleForm
      cardStyle={cardStyle}
      saved={!!searchParams?.saved}
      label={label}
    />
  );
};

export default CardStylePage;
