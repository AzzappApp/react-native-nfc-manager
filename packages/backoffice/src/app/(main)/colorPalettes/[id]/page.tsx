import { notFound } from 'next/navigation';
import { getColorPaletteById } from '@azzapp/data/domains';
import ColorPaletteForm from '../ColorPaletteForm';

type ColorPalettePageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    saved?: string;
  };
};

const ColorPalettePage = async ({
  params: { id },
  searchParams,
}: ColorPalettePageProps) => {
  const colorPalette = await getColorPaletteById(id);
  if (!colorPalette) {
    return notFound();
  }
  return (
    <ColorPaletteForm
      colorPalette={colorPalette}
      saved={!!searchParams?.saved}
    />
  );
};

export default ColorPalettePage;
