/**
 * Loader component from azzapp-users-manager-webapp
 */

import Lottie from 'react-lottie';
import * as animationData from './loader.json';

type Props = {
  width?: number;
  height?: number;
};

const defaultOptions = {
  loop: true,
  autoplay: true,
};

const Loader = ({ width = 100, height = 75 }: Props) => {
  return (
    <Lottie
      options={{
        ...defaultOptions,
        animationData,
      }}
      height={height}
      width={width}
    />
  );
};

export default Loader;
