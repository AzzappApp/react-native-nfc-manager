import { notFound } from 'next/navigation';
import { getCardStyleById, getLocalizationMessagesByKeys } from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
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
  const [label] = await getLocalizationMessagesByKeys([id], DEFAULT_LOCALE);

  return (
    <CardStyleForm
      cardStyle={cardStyle}
      saved={!!searchParams?.saved}
      label={label?.value}
    />
  );
};

export default CardStylePage;
