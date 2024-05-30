import { notFound } from 'next/navigation';
import { getCoverTemplateTypeById, getLabel } from '@azzapp/data';
import CoverTemplateTypeForm from '../CoverTemplateTypeForm';

type CoverTemplateTypePageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    saved?: string;
  };
};

const CoverTemplateTypePage = async ({
  params: { id },
  searchParams,
}: CoverTemplateTypePageProps) => {
  const coverTemplateType = await getCoverTemplateTypeById(id);
  if (!coverTemplateType) {
    return notFound();
  }

  const label = await getLabel(coverTemplateType.labelKey);

  return (
    <CoverTemplateTypeForm
      saved={!!searchParams?.saved}
      label={label}
      coverTemplateType={coverTemplateType}
    />
  );
};

export default CoverTemplateTypePage;
