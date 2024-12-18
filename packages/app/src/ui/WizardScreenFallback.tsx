import { useCallback } from 'react';
import { useRouter } from '#components/NativeRouter';
import useScreenInsets from '#hooks/useScreenInsets';
import LoadingScreen from '#screens/LoadingScreen';
import Container from './Container';
import WizardPagerHeader from './WizardPagerHeader';
import type { Icons } from './Icon';

const createWizardScreenFallback = ({
  backIcon,
  currentPage,
  nbPages,
}: {
  backIcon?: Icons;
  nbPages: number;
  currentPage: number;
}) => {
  const WizardScreenFallback = () => {
    const router = useRouter();
    const onBack = useCallback(() => {
      router.back();
    }, [router]);

    const insets = useScreenInsets();

    return (
      <Container style={{ flex: 1, paddingTop: insets.top }}>
        <WizardPagerHeader
          nbPages={nbPages}
          currentPage={currentPage}
          onBack={onBack}
          title=""
          backIcon={backIcon}
        />
        <LoadingScreen />
      </Container>
    );
  };
  return WizardScreenFallback;
};

export default createWizardScreenFallback;
