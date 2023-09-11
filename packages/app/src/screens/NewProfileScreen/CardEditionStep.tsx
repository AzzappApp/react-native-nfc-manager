import { Suspense } from 'react';
import { StyleSheet, View } from 'react-native';
import CardTemplateList from '#components/CardTemplateList';
import useLoadCardTemplateMutation from '#hooks/useLoadCardTemplateMutation';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';

type CardEditionStepPros = {
  height: number;
  onSkip?: () => void;
  onCoverTemplateApplied: () => void;
  hideHeader: () => void;
  showHeader: () => void;
};

const CardEditionStep = ({
  height,
  onSkip,
  onCoverTemplateApplied,
  hideHeader,
  showHeader,
}: CardEditionStepPros) => {
  const insets = useScreenInsets();
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
        onPreviewModal={hideHeader}
        onPreviewModalClose={showHeader}
        previewModalStyle={{
          transform: [{ translateY: -insets.top }],
        }}
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
