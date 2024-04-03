import { getColorPalettes } from '@azzapp/data';
import ColorPalettesList from './ColorPalettesList';

const ColorPalettesPage = async () => {
  const colorsPalettes = await getColorPalettes();

  return <ColorPalettesList colorPalettes={colorsPalettes} />;
};

export default ColorPalettesPage;
