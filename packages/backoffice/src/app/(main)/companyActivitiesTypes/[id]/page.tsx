import { notFound } from 'next/navigation';
import {
  getCompanyActivityTypeById,
  getLocalizationMessagesByKeys,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
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

  const [message] = await getLocalizationMessagesByKeys(
    [companyActivitiesType.id],
    DEFAULT_LOCALE,
  );

  return (
    <CompanyActivitiesTypeForm
      companyActivitiesType={companyActivitiesType}
      label={message?.value}
    />
  );
};

export default CardTemplatePage;
