import { notFound } from 'next/navigation';
import {
  getCompanyActivityById,
  getLocalizationMessagesByLocale,
  getCardTemplateTypes,
  getCompanyActivityTypes,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import CompanyActivityForm from '../CompanyActivityForm';
type CardTemplatePageProps = {
  params: {
    id: string;
  };
};

const CardTemplatePage = async (props: CardTemplatePageProps) => {
  const { params } = props;

  const [template, allCardTemplateTypes, companyActivitiesTypes] =
    await Promise.all([
      getCompanyActivityById(params.id),
      getCardTemplateTypes(false),
      getCompanyActivityTypes(),
    ]);

  if (!template) {
    return notFound();
  }

  const cardTemplateTypes = allCardTemplateTypes.filter(
    type => type.enabled || type.id === template.cardTemplateTypeId,
  );

  const labels = await getLocalizationMessagesByLocale(DEFAULT_LOCALE);

  return (
    <CompanyActivityForm
      companyActivity={template}
      cardTemplateTypes={cardTemplateTypes}
      companyActivitiesTypes={companyActivitiesTypes}
      labels={labels}
    />
  );
};

export default CardTemplatePage;
