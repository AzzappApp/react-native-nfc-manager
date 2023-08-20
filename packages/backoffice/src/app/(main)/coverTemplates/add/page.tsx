import { getColorPalettes, getStaticMediasByUsage } from '@azzapp/data/domains';
import CoverTemplateForm from '../CoverTemplatesForm';

const NewCoverTemplatePage = async () => {
  const coverForegrounds = await getStaticMediasByUsage('coverForeground');
  const coverBackgrounds = await getStaticMediasByUsage('coverBackground');
  const colorPalettes = await getColorPalettes();

  return (
    <CoverTemplateForm
      coverForegrounds={coverForegrounds}
      coverBackgrounds={coverBackgrounds}
      colorPalettes={colorPalettes}
    />
  );
};

export default NewCoverTemplatePage;
