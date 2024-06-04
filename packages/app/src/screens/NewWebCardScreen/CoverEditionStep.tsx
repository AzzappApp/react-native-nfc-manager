import { Suspense, forwardRef } from 'react';
import { View } from 'react-native';
import { graphql, useLazyLoadQuery } from 'react-relay';
import CoverEditor from '#components/CoverEditor';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ActivityIndicator from '#ui/ActivityIndicator';
import type { CoverEditorHandle } from '#components/CoverEditor/CoverEditor';
import type { TemplateTypePreview } from '#components/CoverEditorTemplateList';
import type { CoverEditionStepQuery } from '#relayArtifacts/CoverEditionStepQuery.graphql';
import type { ColorPaletteColor } from '@azzapp/shared/cardHelpers';
import type { ForwardedRef } from 'react';

type CoverEditionStepProps = {
  profileId: string;
  height: number;
  coverTemplatePreview: TemplateTypePreview | null;
  backgroundColor: ColorPaletteColor | null;
  setCanSave: (value: boolean) => void;
};

const CoverEditionStep = (
  {
    height,
    profileId,
    coverTemplatePreview,
    backgroundColor,
    setCanSave,
  }: CoverEditionStepProps,
  ref: ForwardedRef<CoverEditorHandle>,
) => {
  const data = useLazyLoadQuery<CoverEditionStepQuery>(
    graphql`
      query CoverEditionStepQuery($profileId: ID!) {
        profile: node(id: $profileId) {
          ...CoverEditor_profile
        }
      }
    `,
    { profileId },
  );

  const styles = useStyleSheet(stylesheet);

  return (
    <View style={{ height }}>
      <Suspense
        fallback={
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator />
          </View>
        }
      >
        <View style={{ flex: 1 }}>
          {data.profile && (
            <CoverEditor
              profile={data.profile}
              coverTemplatePreview={coverTemplatePreview}
              backgroundColor={backgroundColor}
              onCanSaveChange={setCanSave}
              ref={ref}
            />
          )}
        </View>
      </Suspense>
    </View>
  );
};

export default forwardRef(CoverEditionStep);

const stylesheet = createStyleSheet(() => ({
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
