import { notFound } from 'next/navigation';
import { getPredefinedCoverById } from '@azzapp/data';
import PredefinedCoverForm from '../PredefinedCoverForm';

type PredefinedCoverProps = {
  params: {
    id: string;
  };
};

const PredefinedCoverPage = async ({
  params: { id },
}: PredefinedCoverProps) => {
  const predefinedCover = await getPredefinedCoverById(id);
  if (!predefinedCover) {
    return notFound();
  }
  return <PredefinedCoverForm predefinedCover={predefinedCover} />;
};

export default PredefinedCoverPage;
