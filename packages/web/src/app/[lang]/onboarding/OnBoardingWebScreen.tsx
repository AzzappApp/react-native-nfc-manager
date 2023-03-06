'use client';

import { useRouter } from '@azzapp/app/PlatformEnvironment';
import OnBoardingScreen from '@azzapp/app/screens/OnBoardingScreen';

const OnBoardingWebScreen = () => {
  const router = useRouter();
  const skip = async () => {
    router.push({ route: 'HOME' });
  };
  return <OnBoardingScreen skip={skip} />;
};

export default OnBoardingWebScreen;
