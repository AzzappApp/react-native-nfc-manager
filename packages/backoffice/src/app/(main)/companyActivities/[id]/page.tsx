import { notFound } from 'next/navigation';
import {
  db,
  CardTemplateTypeTable,
  getCompanyActivityById,
  CompanyActivityTypeTable,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CompanyActivityForm from '../CompanyActivityForm';
type CardTemplatePageProps = {
  params: {
    id: string;
  };
};

const CardTemplatePage = async (props: CardTemplatePageProps) => {
  const { params } = props;

  const template = await getCompanyActivityById(params.id);
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);

  const companyActivitiesTypes = await db
    .select()
    .from(CompanyActivityTypeTable);

  if (!template) {
    return notFound();
  }

  const labels = await getLocalizationMessagesByLocaleAndTarget(
    DEFAULT_LOCALE,
    ENTITY_TARGET,
  );

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
