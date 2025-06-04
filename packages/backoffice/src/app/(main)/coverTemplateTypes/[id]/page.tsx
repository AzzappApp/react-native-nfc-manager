import { notFound } from 'next/navigation';
import {
  getCoverTemplateTypeById,
  getLocalizationMessagesByKeys,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import CoverTemplateTypeForm from '../CoverTemplateTypeForm';

type CoverTemplateTypePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    saved?: string;
  }>;
};

const CoverTemplateTypePage = async (props: CoverTemplateTypePageProps) => {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { id } = params;

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
