'use client';

import { useRouter } from '@azzapp/app/lib/PlatformEnvironment';
import OnBoardingScreen from '@azzapp/app/lib/screens/OnBoardingScreen';

const OnBoardingPage = () => {
  const router = useRouter();
  const skip = async () => {
    router.push({ route: 'HOME' });
  };
  return <OnBoardingScreen skip={skip} />;
};

export default OnBoardingPage;

export const dynamic = 'force-static';
