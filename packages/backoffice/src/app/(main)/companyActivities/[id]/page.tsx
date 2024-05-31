import { notFound } from 'next/navigation';
import {
  db,
  CardTemplateTypeTable,
  getCompanyActivityById,
  getLabels,
  getLabel,
  CompanyActivityTypeTable,
} from '@azzapp/data';
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

  const labels = await getLabels(
    cardTemplateTypes
      .map(type => type.labelKey)
      .concat(companyActivitiesTypes.map(type => type.labelKey)),
  );

  if (!template) {
    return notFound();
  }

  const label = await getLabel(template.labelKey);

  return (
    <CompanyActivityForm
      companyActivity={template}
      cardTemplateTypes={cardTemplateTypes}
      cardTemplateTypesLabels={labels.filter(label =>
        cardTemplateTypes.some(type => type.labelKey === label.labelKey),
      )}
      companyActivityTypesLabels={labels.filter(label =>
        companyActivitiesTypes.some(type => type.labelKey === label.labelKey),
      )}
      companyActivitiesTypes={companyActivitiesTypes}
      label={label}
    />
  );
};

export default CardTemplatePage;
