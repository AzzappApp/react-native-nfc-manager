import { notFound } from 'next/navigation';
import {
  getCardTemplateTypes,
  getCompanyActivities,
  getCompanyActivitiesByWebCardCategory,
  getLocalizationMessagesByLocaleAndTarget,
  getWebCardCategoryById,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import WebCardCategoryForm from '../WebCardCategoryForm';

type WebCardCategoryPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    saved?: string;
  };
};

const WebCardCategoryPage = async ({
  params: { id },
  searchParams,
}: WebCardCategoryPageProps) => {
  const webCardCategory = await getWebCardCategoryById(id);
  if (!webCardCategory) {
    return notFound();
  }
  const [
    companyActivities,
    cardTemplateTypes,
    categoryCompanyActivities,
    labels,
  ] = await Promise.all([
    getCompanyActivities(),
    getCardTemplateTypes(false).then(types =>
      types.filter(
        type => type.enabled || type.id === webCardCategory.cardTemplateTypeId,
      ),
    ),
    getCompanyActivitiesByWebCardCategory(id).then(activities =>
      activities.map(activity => activity.id),
    ),
    getLocalizationMessagesByLocaleAndTarget(DEFAULT_LOCALE, ENTITY_TARGET),
  ]);

  return (
    <WebCardCategoryForm
      webCardCategory={webCardCategory}
      companyActivities={companyActivities}
      categoryCompanyActivities={categoryCompanyActivities}
      cardTemplateTypes={cardTemplateTypes}
      labels={labels}
      saved={!!searchParams?.saved}
    />
  );
};

export default WebCardCategoryPage;
