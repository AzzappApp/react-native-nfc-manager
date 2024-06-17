import {
  getColorPalettes,
  getCoverTemplateTags,
  getCoverTemplateTypes,
  getLabel,
} from '@azzapp/data';
import CoverTemplateForm from '../CoverTemplatesForm';

const NewCoverTemplatePage = async () => {
  const colorPalettes = await getColorPalettes();
  const coverTemplateTags = await getCoverTemplateTags();
  const coverTemplateTagsWithLabels = await Promise.all(
    coverTemplateTags.map(async tag => {
      const label = await getLabel(tag.labelKey);

      return { ...tag, label: label?.baseLabelValue || '' };
    }),
  );
  const coverTemplateTypes = await getCoverTemplateTypes();
  const coverTemplateTypesWithLabels = await Promise.all(
    coverTemplateTypes.map(async type => {
      const label = await getLabel(type.labelKey);

      return { ...type, label: label?.baseLabelValue || '' };
    }),
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
