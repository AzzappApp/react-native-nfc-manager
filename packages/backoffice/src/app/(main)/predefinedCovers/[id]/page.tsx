import { notFound } from 'next/navigation';
import { getPredefinedCoverById } from '@azzapp/data';
import PredefinedCoverForm from '../PredefinedCoverForm';

type PredefinedCoverProps = {
  params: Promise<{
    id: string;
  }>;
};

const PredefinedCoverPage = async (props: PredefinedCoverProps) => {
  const params = await props.params;

  const { id } = params;

  const predefinedCover = await getPredefinedCoverById(id);
  if (!predefinedCover) {
    return notFound();
  }
  return <PredefinedCoverForm predefinedCover={predefinedCover} />;
};

export default PredefinedCoverPage;
