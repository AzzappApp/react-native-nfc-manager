import { Suspense } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CardTemplateList from '#components/CardTemplateList';
import useLoadCardTemplateMutation from '#hooks/useLoadCardTemplateMutation';
import ActivityIndicator from '#ui/ActivityIndicator';

type CardEditionStepPros = {
  height: number;
  onSkip?: () => void;
  onCoverTemplateApplied: () => void;
};

const CardEditionStep = ({
  height,
  onSkip,
  onCoverTemplateApplied,
}: CardEditionStepPros) => {
  const insets = useSafeAreaInsets();
  const eidtorHeight = height - Math.min(insets.bottom, 16);

  const [commit, inFlight] = useLoadCardTemplateMutation();

  const onSubmit = (cardTemplateId: string) => {
    commit({
      variables: {
        loadCardTemplateInput: {
          cardTemplateId,
        },
      },
      onCompleted: () => {
        onCoverTemplateApplied();
      },
    });
  };

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
        onSkip={onSkip}
        onApplyTemplate={onSubmit}
        loading={inFlight}
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
