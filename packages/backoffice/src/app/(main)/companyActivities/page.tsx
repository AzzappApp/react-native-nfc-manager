import { CompanyActivityTable, db } from '@azzapp/data';
import CompanyActivitiesList from './CompanyActivitiesList';

const CompanyActivitiesPage = async () => {
  const companyActivities = await db.select().from(CompanyActivityTable);
  return (
    <CompanyActivitiesList
      companyActivities={companyActivities}
      pageSize={PAGE_SIZE}
    />
  );
};

export default CompanyActivitiesPage;

const PAGE_SIZE = 50;
