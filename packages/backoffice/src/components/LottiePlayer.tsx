import {
  DotLottiePlayer,
  type Props as LottiePlayerProps,
} from '@dotlottie/react-player';
import { useEffect, useMemo, useState } from 'react';
import { LOTTIE_REPLACE_COLORS } from '@azzapp/shared/coverHelpers';
import { replaceColors } from '@azzapp/shared/lottieHelpers';

const LottiePlayer = ({
  tintColor,
  src,
  ...props
}: LottiePlayerProps & {
  tintColor?: string | null | undefined;
  src: string | null;
}) => {
  const [lottieJSON, setLottieJSON] = useState<any>(null);

  useEffect(() => {
    let canceled = false;

    setLottieJSON(null);
    if (src != null) {
      fetch(src)
        .then(res => res.json())
        .then(json => {
          if (canceled) {
            return;
          }
          setLottieJSON(json);
        });
    }
    return () => {
      canceled = true;
    };
  }, [src]);

  const animationData = useMemo(() => {
    if (!tintColor || !lottieJSON) {
      return lottieJSON;
    }
    return replaceColors(
      [
        {
          sourceColor: LOTTIE_REPLACE_COLORS.primary,
          targetColor: tintColor,
        },
      ],
      lottieJSON,
    );
  }, [lottieJSON, tintColor]);

  return <DotLottiePlayer src={animationData} {...props} />;
};

export default LottiePlayer;
