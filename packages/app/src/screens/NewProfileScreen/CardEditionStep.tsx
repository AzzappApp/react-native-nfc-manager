import { Suspense } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CardTemplateList from '#components/CardTemplateList';
import ActivityIndicator from '#ui/ActivityIndicator';

type CardEditionStepPros = {
  height: number;
  onCoverTemplateApplied: () => void;
};

const CardEditionStep = ({
  height,
  onCoverTemplateApplied,
}: CardEditionStepPros) => {
  const insets = useSafeAreaInsets();
  const eidtorHeight = height - Math.min(insets.bottom, 16);

  return (
    <Suspense
      fallback={
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator />
        </View>
      }
    >
      <CardTemplateList
        height={eidtorHeight}
        onSkip={onCoverTemplateApplied}
        onTemplateApplied={onCoverTemplateApplied}
      />
    </Suspense>
  );
};

export default CardEditionStep;

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 200,
  },
});
