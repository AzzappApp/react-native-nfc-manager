import {
  db,
  CardTemplateTypeTable,
  getCompanyActivityById,
} from '@azzapp/data/domains';
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
  return (
    <CompanyActivityForm
      companyActivity={template}
      cardTemplateTypes={cardTemplateTypes}
    />
  );
};

export default CardTemplatePage;
