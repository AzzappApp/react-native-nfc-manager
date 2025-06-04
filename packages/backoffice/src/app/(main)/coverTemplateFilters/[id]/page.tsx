import { notFound } from 'next/navigation';
import {
  getCoverTemplateTagById,
  getLocalizationMessagesByKeys,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { TEMPLATE_COVERTAG_DESCRIPTION_PREFIX } from '@azzapp/shared/translationsContants';
import CoverTemplateTagForm from '../CoverTemplateTagsForm';

type CoverTemplateTagPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    saved?: string;
  }>;
};

const CoverTemplateTagPage = async (props: CoverTemplateTagPageProps) => {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { id } = params;

  const coverTemplateTag = await getCoverTemplateTagById(id);
  if (!coverTemplateTag) {
    return notFound();
  }

  const [message] = await getLocalizationMessagesByKeys(
    [coverTemplateTag.id],
    DEFAULT_LOCALE,
  );
  const [description] = await getLocalizationMessagesByKeys(
    [TEMPLATE_COVERTAG_DESCRIPTION_PREFIX + coverTemplateTag.id],
    DEFAULT_LOCALE,
  );

  return (
    <CoverTemplateTagForm
      saved={!!searchParams?.saved}
      label={message?.value}
      description={description?.value}
      coverTemplateTag={coverTemplateTag}
    />
  );
};

export default CoverTemplateTagPage;
