import { notFound } from 'next/navigation';
import {
  getCardTemplateTypeById,
  getLocalizationMessagesByLocale,
  getWebCardCategories,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import CardTemplateTypesForm from '../CardTemplateTypesForm';

type CardTemplatePageProps = {
  params: {
    id: string;
  };
};

const CardTemplatePage = async (props: CardTemplatePageProps) => {
  const { params } = props;

  const [template, allWebCardCategories, labels] = await Promise.all([
    getCardTemplateTypeById(params.id),
    getWebCardCategories(false),
    getLocalizationMessagesByLocale(DEFAULT_LOCALE),
  ]);

  if (!template) {
    return notFound();
  }

  // Filter out disabled categories but keep the one that is assigned to the template
  const webCardCategories = allWebCardCategories.filter(
    category => category.enabled || category.id === template.webCardCategoryId,
  );

  return (
    <CardTemplateTypesForm
      cardTemplateType={template}
      webCardCategories={webCardCategories}
      labels={labels}
    />
  );
};

export default CardTemplatePage;
