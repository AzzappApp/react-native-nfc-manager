import { CardTemplateTypeTable, db } from '@azzapp/data';
import CompanyActivityForm from '../CompanyActivityForm';
const NewCompanyActivityPage = async () => {
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);
  return <CompanyActivityForm cardTemplateTypes={cardTemplateTypes} />;
};

export default NewCompanyActivityPage;
