import { Suspense } from 'react';
import { View } from 'react-native';
import { graphql, useLazyLoadQuery } from 'react-relay';
import CoverEditorTemplateList from '#components/CoverEditorTemplateList';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import ActivityIndicator from '#ui/ActivityIndicator';
import type { TemplateTypePreview } from '#components/CoverEditorTemplateList';
import type { CoverTemplateSelectionStepQuery } from '#relayArtifacts/CoverTemplateSelectionStepQuery.graphql';
import type { ColorPaletteColor } from '@azzapp/shared/cardHelpers';

type CoverTemplateSelectionStepProps = {
  profileId: string;
  height: number;
  onTemplateSelected: (args: {
    template: TemplateTypePreview | null;
    backgroundColor: ColorPaletteColor | null;
  }) => void;
};

const CoverTemplateSelectionStep = ({
  height,
  profileId,
  onTemplateSelected,
}: CoverTemplateSelectionStepProps) => {
  const data = useLazyLoadQuery<CoverTemplateSelectionStepQuery>(
    graphql`
      query CoverTemplateSelectionStepQuery($profileId: ID!) {
        profile: node(id: $profileId) {
          ...CoverEditorTemplateList_profile
        }
      }
    `,
    { profileId },
  );

  // const insets = useScreenInsets();

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
            <CoverEditorTemplateList
              profile={data.profile}
              onSelectCoverTemplatePreview={onTemplateSelected}
            />
          )}
        </View>
      </Suspense>
    </View>
  );
};

export default CoverTemplateSelectionStep;

const stylesheet = createStyleSheet(() => ({
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
