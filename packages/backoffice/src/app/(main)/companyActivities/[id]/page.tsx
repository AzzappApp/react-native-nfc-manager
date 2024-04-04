import { notFound } from 'next/navigation';
import {
  db,
  CardTemplateTypeTable,
  getCompanyActivityById,
  getLabels,
  getLabel,
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

  const cardTemplateTypesLabels = await getLabels(
    cardTemplateTypes.map(({ labelKey }) => labelKey),
  );

  if (!template) {
    return notFound();
  }

  const label = await getLabel(template.labelKey);

  return (
    <CompanyActivityForm
      companyActivity={template}
      cardTemplateTypes={cardTemplateTypes}
      cardTemplateTypesLabels={cardTemplateTypesLabels}
      label={label}
    />
  );
};

export default CardTemplatePage;
