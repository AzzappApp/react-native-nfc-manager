import { redirect } from 'next/navigation';
import getCurrentUser from '#helpers/getCurrentUser';
import backOfficeSections from '../../backOfficeSections';
import type { SubSection } from '../../backOfficeSections';

const RootPage = async () => {
  const user = await getCurrentUser();
  const link = backOfficeSections
    .reduce((acc, section) => {
      if ('subSections' in section) {
        return [...acc, ...section.subSections];
      } else {
        return [...acc, section];
      }
    }, [] as SubSection[])
    .find(page => user?.roles?.some(role => page.roles.includes(role)));
  redirect(link ? link.href : '/login');
};

export default RootPage;
