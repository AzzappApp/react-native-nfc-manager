import { getColorPalettes } from '@azzapp/data';
import ColorPalettesList from './ColorPalettesList';

const ColorPalettesPage = async () => {
  const colorsPalettes = await getColorPalettes();

  return (
    <ColorPalettesList colorPalettes={colorsPalettes} pageSize={PAGE_SIZE} />
  );
};

export default ColorPalettesPage;

const PAGE_SIZE = 100;
