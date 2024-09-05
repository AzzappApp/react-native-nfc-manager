import { getColorPalettes } from '@azzapp/data';
import ColorPalettesList from './ColorPalettesList';

const ColorPalettesPage = async () => {
  const colorPalettes = await getColorPalettes(false);

  return <ColorPalettesList colorPalettes={colorPalettes} />;
};

export default ColorPalettesPage;
