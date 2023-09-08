import { asc, eq } from 'drizzle-orm';
import {
  CompanyActivityTable,
  MediaSuggestionTable,
  ProfileCategoryTable,
  db,
  getMediasByIds,
} from '@azzapp/data/domains';
import MediaSuggestionsList from './MediaSuggestionsList';

const StaticMediasPage = async () => {
  const suggestions = await db.select().from(MediaSuggestionTable);
  const profileCategories = await db
    .select()
    .from(ProfileCategoryTable)
    .where(eq(ProfileCategoryTable.enabled, true))
    .orderBy(asc(ProfileCategoryTable.order));

  const companyActivities = await db.select().from(CompanyActivityTable);

  const mediasSuggestions = suggestions.reduce(
    (acc, suggestion) => {
      const { mediaId, companyActivityId, profileCategoryId } = suggestion;
      if (!acc[mediaId]) {
        acc[mediaId] = {
          kind: 'image',
          activities: {},
          categories: {},
        };
      }
      if (companyActivityId) {
        acc[mediaId].activities[companyActivityId] = true;
      }

      if (profileCategoryId) {
        acc[mediaId].categories[profileCategoryId] = true;
      }
      return acc;
    },
    {} as Record<
      string,
      {
        kind: 'image' | 'video';
        activities: Record<string, boolean>;
        categories: Record<string, boolean>;
      }
    >,
  );

  const mediasIds = Object.keys(mediasSuggestions);
  const medias = await getMediasByIds(mediasIds);

  medias.forEach((media, index) => {
    if (!media) {
      console.warn('Media not found ' + mediasIds[index]);
      delete mediasSuggestions[mediasIds[index]];
      return;
    }
    mediasSuggestions[media.id].kind = media.kind;
  });

  const sortedMediasSuggestions = Object.fromEntries(
    Object.entries(mediasSuggestions).sort(([idA], [idB]) =>
      idA.localeCompare(idB),
    ),
  );

  companyActivities.sort((a, b) =>
    (a.labels?.en ?? '').localeCompare(b.labels?.en ?? ''),
  );
  profileCategories.sort((a, b) =>
    (a.labels?.en ?? '').localeCompare(b.labels?.en ?? ''),
  );

  return (
    <MediaSuggestionsList
      activities={companyActivities}
      categories={profileCategories}
      mediasSuggestions={sortedMediasSuggestions}
    />
  );
};

export default StaticMediasPage;
