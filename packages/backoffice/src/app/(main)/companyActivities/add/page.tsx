import { CardTemplateTypeTable, db, getLabels } from '@azzapp/data';
import CompanyActivityForm from '../CompanyActivityForm';
const NewCompanyActivityPage = async () => {
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);

  const cardTemplateTypesLabels = await getLabels(
    cardTemplateTypes.map(cardTemplateType => cardTemplateType.labelKey),
  );

  return (
    <CompanyActivityForm
      cardTemplateTypes={cardTemplateTypes}
      cardTemplateTypesLabels={cardTemplateTypesLabels}
    />
  );
};

export default NewCompanyActivityPage;
