import { notFound } from 'next/navigation';
import { getCoverTemplateTagById, getLabel } from '@azzapp/data';
import CoverTemplateTagForm from '../CoverTemplateTagsForm';

type CoverTemplateTagPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    saved?: string;
  };
};

const CoverTemplateTagPage = async ({
  params: { id },
  searchParams,
}: CoverTemplateTagPageProps) => {
  const coverTemplateTag = await getCoverTemplateTagById(id);
  if (!coverTemplateTag) {
    return notFound();
  }

  const label = await getLabel(coverTemplateTag.labelKey);

  return (
    <CoverTemplateTagForm
      saved={!!searchParams?.saved}
      label={label}
      coverTemplateTag={coverTemplateTag}
    />
  );
};

export default CoverTemplateTagPage;
