import { getModuleBackgrounds } from '@azzapp/data';
import ModuleBackgroundsList from './ModuleBackgroundsList';

const ModuleBackgroundsPage = async () => {
  const moduleBackgrounds = await getModuleBackgrounds(false);

  return <ModuleBackgroundsList moduleBackgrounds={moduleBackgrounds} />;
};

export default ModuleBackgroundsPage;
