import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import useScreenInsets from '#hooks/useScreenInsets';
import { SocialIcon } from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import { useCoverEditorContext } from './CoverEditorContext';
import CoverPreview from './CoverPreview';
import CoverEditorToolbox from './toolbox/CoverEditorToolbox';
import type { CoverEditor_profile$key } from '#relayArtifacts/CoverEditor_profile.graphql';
import type { TemplateTypePreview } from './templateList/CoverEditorTemplateTypePreviews';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';
import type { LayoutChangeEvent } from 'react-native';

type Props = {
  profile: CoverEditor_profile$key;
  coverTemplatePreview: TemplateTypePreview | null;
};

export type CoverLayerType = 'links' | 'overlay' | 'text' | null;

const CoverEditor = ({ profile: profileKey, coverTemplatePreview }: Props) => {
  const { bottom } = useScreenInsets();

  const { coverEditorState, dispatch } = useCoverEditorContext();

  const [contentSize, setContentSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const onContentLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      setContentSize({
        width: layout.width,
        height: layout.height,
      });
    },
    [],
  );

  const onEditLinks = useCallback(() => {
    dispatch({
      type: 'SELECT_LAYER',
      payload: {
        index: null,
        layerMode: 'links',
      },
    });
  }, [dispatch]);

  const profile = useFragment(
    graphql`
      fragment CoverEditor_profile on Profile {
        webCard {
          cardColors {
            primary
            light
            dark
          }
        }
        ...CoverEditorToolbox_profile
      }
    `,
    profileKey,
  );

  const { linksLayer } = coverEditorState;

  return (
    <View style={[styles.container, { marginBottom: bottom }]}>
      <View style={styles.content} onLayout={onContentLayout}>
        <PressableNative
          style={{ width: '100%', flexDirection: 'row' }}
          onPress={() => onEditLinks()}
        >
          {contentSize && (
            <CoverPreview
              coverEditorState={coverEditorState}
              width={contentSize.width}
              height={contentSize.height}
              style={styles.coverPreview}
            />
          )}
          {linksLayer.links.map(link => {
            return (
              <SocialIcon
                style={{
                  height: linksLayer.style.size,
                  width: linksLayer.style.size,
                  tintColor: swapColor(
                    linksLayer.style.color,
                    profile.webCard?.cardColors,
                  ),
                }}
                key={link.socialId}
                icon={link.socialId as SocialLinkId}
              />
            );
          })}
        </PressableNative>
      </View>
      <View style={{ height: 50 }} />
      <CoverEditorToolbox
        coverTemplatePreview={coverTemplatePreview}
        profile={profile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    margin: 40,
  },
  coverPreview: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default CoverEditor;
