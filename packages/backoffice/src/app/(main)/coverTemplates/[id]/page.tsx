import { notFound } from 'next/navigation';
import {
  getColorPalettes,
  getCoverTemplatesByIds,
  getMediasByIds,
  getStaticMediasByUsage,
} from '@azzapp/data/domains';
import CoverTemplateForm from '../CoverTemplatesForm';

type CoverTemplatePageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    saved?: string;
  };
};

const CoverTemplatePage = async ({
  params: { id },
  searchParams,
}: CoverTemplatePageProps) => {
  const [coverTemplate] = await getCoverTemplatesByIds([id]);
  const [previewMedia] = coverTemplate
    ? await getMediasByIds([coverTemplate.previewMediaId])
    : [];
  if (!coverTemplate || !previewMedia) {
    return notFound();
  }

  const coverForegrounds = await getStaticMediasByUsage('coverForeground');
  const coverBackgrounds = await getStaticMediasByUsage('coverBackground');
  const colorPalettes = await getColorPalettes();

  return (
    <CoverTemplateForm
      coverTemplate={coverTemplate}
      coverForegrounds={coverForegrounds}
      coverBackgrounds={coverBackgrounds}
      colorPalettes={colorPalettes}
      previewMedia={previewMedia}
      saved={!!searchParams?.saved}
    />
  );
};

export default CoverTemplatePage;
