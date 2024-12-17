import useScreenDimensions from '#hooks/useScreenDimensions';
import CardModuleBackgroundImageSkia from './CardModuleBackgroundImageSkia';
import CardModuleBackgroundImageSvg from './CardModuleBackgroundImageSvg';
import type { CardModuleBackgroundImageProps } from './types';

const CardModuleBackgroundImage = (props: CardModuleBackgroundImageProps) => {
  const { height } = useScreenDimensions();

  // If the image is taller than the screen, use react-native-svg (skia crashes on large images - see https://github.com/Shopify/react-native-skia/issues/1297)
  if (props.layout.height > height) {
    return <CardModuleBackgroundImageSvg {...props} />;
  } else {
    return <CardModuleBackgroundImageSkia {...props} />;
  }
};

export default CardModuleBackgroundImage;
