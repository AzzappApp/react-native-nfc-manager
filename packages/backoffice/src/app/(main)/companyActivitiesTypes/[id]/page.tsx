import { notFound } from 'next/navigation';
import { getLabel, getCompanyActivityTypeById } from '@azzapp/data';
import CompanyActivitiesTypeForm from '../CompanyActivitiesTypeForm';
type CompanyActivitiesTypePageProps = {
  params: {
    id: string;
  };
};

const CardTemplatePage = async (props: CompanyActivitiesTypePageProps) => {
  const { params } = props;

  const companyActivitiesType = await getCompanyActivityTypeById(params.id);

  if (!companyActivitiesType) {
    return notFound();
  }

  const label = await getLabel(companyActivitiesType.labelKey);

  return (
    <CompanyActivitiesTypeForm
      companyActivitiesType={companyActivitiesType}
      label={label}
    />
  );
};

export default CardTemplatePage;
