import {
  getColorPalettes,
  getCoverTemplateTags,
  getCoverTemplateTypes,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CoverTemplateForm from '../CoverTemplatesForm';

const NewCoverTemplatePage = async () => {
  const labelsMap = (
    await getLocalizationMessagesByLocaleAndTarget(
      DEFAULT_LOCALE,
      ENTITY_TARGET,
    )
  ).reduce(
    (acc, message) => {
      acc[message.key] = message.value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const colorPalettes = await getColorPalettes();
  const coverTemplateTags = await getCoverTemplateTags();
  const coverTemplateTagsWithLabels = await Promise.all(
    coverTemplateTags.map(async tag => ({
      ...tag,
      label: labelsMap[tag.id],
    })),
  );
  const coverTemplateTypes = await getCoverTemplateTypes();
  const coverTemplateTypesWithLabels = await Promise.all(
    coverTemplateTypes.map(async type => ({
      ...type,
      label: labelsMap[type.id],
    })),
  );

  return (
    <CoverTemplateForm
      colorPalettes={colorPalettes}
      coverTemplateTypes={coverTemplateTypesWithLabels}
      coverTemplateTags={coverTemplateTagsWithLabels}
    />
  );
};

export default NewCoverTemplatePage;
