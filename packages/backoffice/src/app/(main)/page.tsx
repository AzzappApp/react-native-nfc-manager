import { redirect } from 'next/navigation';
import getCurrentUser from '#helpers/getCurrentUser';
import backOfficeSections from '../../backOfficeSections';
import type { SubSection } from '../../backOfficeSections';

const RootPage = async () => {
  const user = await getCurrentUser();
  const link = backOfficeSections
    .reduce((acc, { subSections }) => {
      return [...acc, ...subSections];
    }, [] as SubSection[])
    .find(page => user?.roles?.some(role => page.roles.includes(role)));
  redirect(link ? link.href : '/login');
};

export default RootPage;
