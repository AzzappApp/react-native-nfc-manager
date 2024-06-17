import {
  getColorPalettes,
  getCoverTemplateById,
  getCoverTemplateTags,
  getCoverTemplateTypes,
  getLabel,
} from '@azzapp/data';

import CoverTemplateForm from '../CoverTemplatesForm';

type CoverTemplatePageProps = {
  params: {
    id: string;
  };
};

const CoverTemplatePage = async ({
  params: { id },
}: CoverTemplatePageProps) => {
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
  const coverTemplate = await getCoverTemplateById(id);

  return (
    <CoverTemplateForm
      coverTemplate={coverTemplate}
      colorPalettes={colorPalettes}
      coverTemplateTypes={coverTemplateTypesWithLabels}
      coverTemplateTags={coverTemplateTagsWithLabels}
    />
  );
};

export default CoverTemplatePage;
