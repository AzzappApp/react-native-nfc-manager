import { Suspense, forwardRef } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import CardTemplateList from '#components/CardTemplateList';
import useLoadCardTemplateMutation from '#hooks/useLoadCardTemplateMutation';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import type { CardTemplatelistHandle } from '#components/CardTemplateList';
import type { ForwardedRef } from 'react';

type CardEditionStepPros = {
  height: number;
  onSkip?: () => void;
  onCoverTemplateApplied: () => void;
  hideHeader: () => void;
  showHeader: () => void;
};

const CardEditionStep = (
  {
    height,
    onSkip,
    onCoverTemplateApplied,
    hideHeader,
    showHeader,
  }: CardEditionStepPros,
  forwardRef: ForwardedRef<CardTemplatelistHandle>,
) => {
  const insets = useScreenInsets();
  const eidtorHeight = height - Math.min(insets.bottom, 16);

  const [commit, inFlight] = useLoadCardTemplateMutation();
  const intl = useIntl();

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
      onError: error => {
        console.error(error);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Error, could not load the template',
            description: 'NewProfile - Card edition step error toast',
          }),
        });
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
        ref={forwardRef}
      />
    </Suspense>
  );
};

export default forwardRef(CardEditionStep);

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 200,
  },
});
