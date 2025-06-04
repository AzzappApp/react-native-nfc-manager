import { notFound } from 'next/navigation';
import { getColorPaletteById } from '@azzapp/data';
import ColorPaletteForm from '../ColorPaletteForm';

type ColorPalettePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    saved?: string;
  }>;
};

const ColorPalettePage = async (props: ColorPalettePageProps) => {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { id } = params;

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
