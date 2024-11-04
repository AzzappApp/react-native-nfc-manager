import { notFound } from 'next/navigation';
import {
  getCoverTemplateTypeById,
  getLocalizationMessagesByKeys,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
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

  const [message] = await getLocalizationMessagesByKeys(
    [coverTemplateType.id],
    DEFAULT_LOCALE,
  );
  return (
    <CoverTemplateTypeForm
      saved={!!searchParams?.saved}
      label={message?.value}
      coverTemplateType={coverTemplateType}
    />
  );
};

export default CoverTemplateTypePage;
