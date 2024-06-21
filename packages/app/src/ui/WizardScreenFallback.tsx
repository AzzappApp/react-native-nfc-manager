import { useCallback } from 'react';
import { View } from 'react-native';
import { useRouter } from '#components/NativeRouter';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from './ActivityIndicator';
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
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator />
        </View>
      </Container>
    );
  };
  return WizardScreenFallback;
};

export default createWizardScreenFallback;
