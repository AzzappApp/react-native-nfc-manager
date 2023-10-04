import { Suspense, forwardRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { colors } from '#theme';
import CoverEditor from '#components/CoverEditor';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import { BUTTON_HEIGHT } from '#ui/Button';
import Text from '#ui/Text';
import type { CoverEditorHandle } from '#components/CoverEditor/CoverEditor';
import type { CoverEditionStepQuery } from '@azzapp/relay/artifacts/CoverEditionStepQuery.graphql';
import type { ProfileKind } from '@azzapp/relay/artifacts/NewProfileScreenQuery.graphql';
import type { ForwardedRef } from 'react';

type CoverEditionStepProps = {
  profileKind: ProfileKind;
  height: number;
  onCoverSaved: () => void;
  setCanSave: (value: boolean) => void;
};

const CoverEditionStep = (
  { profileKind, height, onCoverSaved, setCanSave }: CoverEditionStepProps,
  forwardRef: ForwardedRef<CoverEditorHandle>,
) => {
  const data = useLazyLoadQuery<CoverEditionStepQuery>(
    graphql`
      query CoverEditionStepQuery {
        viewer {
          ...CoverEditor_viewer
          ...useSuggestedMediaManager_suggested
        }
      }
    `,
    {
      initialTemplateKind: profileKind === 'business' ? 'others' : 'people',
    },
  );

  const insets = useScreenInsets();
  const eidtorHeight =
    height - SUBTITLE_HEIGHT - BUTTON_HEIGHT - 16 - Math.min(insets.bottom, 16);

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
        <View style={styles.subTitleContainer}>
          <Text variant="medium" style={styles.subTitle}>
            <FormattedMessage
              defaultMessage="The cover is the first and most visible section of your WebCard{azzappA}"
              description="New profile - cover creation subtitle"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          </Text>
        </View>
        <View style={{ flex: 1, paddingBottom: Math.min(insets.bottom, 16) }}>
          <CoverEditor
            ref={forwardRef}
            viewer={data.viewer}
            height={eidtorHeight}
            onCoverSaved={onCoverSaved}
            onCanSaveChange={setCanSave}
            initialTemplateKind={
              profileKind === 'business' ? 'others' : 'people'
            }
          />
        </View>
      </Suspense>
    </View>
  );
};

export default forwardRef(CoverEditionStep);

const SUBTITLE_HEIGHT = 42;

const stylesheet = createStyleSheet(appearance => ({
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitleContainer: {
    height: SUBTITLE_HEIGHT,
    justifyContent: 'center',
  },
  subTitle: {
    textAlign: 'center',
    marginHorizontal: 40,
    color: appearance === 'dark' ? colors.white : colors.grey900,
  },
  saveButton: {
    marginTop: 16,
    marginHorizontal: 25,
  },
}));
