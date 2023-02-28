import { useCallback } from 'react';
import { useRouter } from '#PlatformEnvironment';

import OnBoardingScreen from '#screens/OnBoardingScreen';

const OnBoardingMobileScreen = () => {
  const router = useRouter();
  const skip = useCallback(() => {
    router.back();
  }, [router]);

  return <OnBoardingScreen skip={skip} />;
};

export default OnBoardingMobileScreen;
