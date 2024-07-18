import { notFound } from 'next/navigation';
import {
  getCoverTemplateTagById,
  getLocalizationMessagesByKeys,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
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

  const [message] = await getLocalizationMessagesByKeys(
    [coverTemplateTag.id],
    DEFAULT_LOCALE,
    ENTITY_TARGET,
  );
  return (
    <CoverTemplateTagForm
      saved={!!searchParams?.saved}
      label={message?.value}
      coverTemplateTag={coverTemplateTag}
    />
  );
};

export default CoverTemplateTagPage;
