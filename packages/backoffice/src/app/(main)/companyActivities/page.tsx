import { CompanyActivityTable, db } from '@azzapp/data';
import CompanyActivitiesList from './CompanyActivitiesList';

const CompanyActivitiesPage = async () => {
  const companyActivities = await db.select().from(CompanyActivityTable);
  return <CompanyActivitiesList companyActivities={companyActivities} />;
};

export default CompanyActivitiesPage;
