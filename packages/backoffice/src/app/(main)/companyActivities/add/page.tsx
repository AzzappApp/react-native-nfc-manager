import {
  CardTemplateTypeTable,
  CompanyActivityTypeTable,
  db,
  getLabels,
} from '@azzapp/data';
import CompanyActivityForm from '../CompanyActivityForm';
const NewCompanyActivityPage = async () => {
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);

  const companyActivitiesTypes = await db
    .select()
    .from(CompanyActivityTypeTable);

  const labels = await getLabels(
    cardTemplateTypes
      .map(type => type.labelKey)
      .concat(companyActivitiesTypes.map(type => type.labelKey)),
  );

  return (
    <CompanyActivityForm
      cardTemplateTypes={cardTemplateTypes}
      companyActivitiesTypes={companyActivitiesTypes}
      cardTemplateTypesLabels={labels.filter(label =>
        cardTemplateTypes.some(type => type.labelKey === label.labelKey),
      )}
      companyActivityTypesLabels={labels.filter(label =>
        companyActivitiesTypes.some(type => type.labelKey === label.labelKey),
      )}
    />
  );
};

export default NewCompanyActivityPage;
