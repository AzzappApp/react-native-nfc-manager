import { notFound } from 'next/navigation';
import {
  getCardTemplateTypeById,
  getLocalizationMessagesByLocale,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import CardTemplateTypesForm from '../CardTemplateTypesForm';

type CardTemplatePageProps = {
  params: Promise<{
    id: string;
  }>;
};

const CardTemplatePage = async (props: CardTemplatePageProps) => {
  const params = await props.params;

  const [template, labels] = await Promise.all([
    getCardTemplateTypeById(params.id),
    getLocalizationMessagesByLocale(DEFAULT_LOCALE),
  ]);

  if (!template) {
    return notFound();
  }
  return <CardTemplateTypesForm cardTemplateType={template} labels={labels} />;
};

export default CardTemplatePage;
