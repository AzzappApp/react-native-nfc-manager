import { Image } from 'expo-image';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import useScreenInsets from '#hooks/useScreenInsets';
import { SocialIcon } from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import { useCoverEditorContext } from './CoverEditorContext';
import CoverEditorToolbox from './toolbox/CoverEditorToolbox';
import type { CoverEditor_profile$key } from '#relayArtifacts/CoverEditor_profile.graphql';
import type { TemplateTypePreview } from './templateList/CoverEditorTemplateTypePreviews';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';

type Props = {
  profile: CoverEditor_profile$key;
  coverTemplatePreview: TemplateTypePreview;
};

export type CoverLayerType = 'links' | 'overlay' | 'text' | null;

const CoverEditor = ({ profile: profileKey, coverTemplatePreview }: Props) => {
  const { bottom } = useScreenInsets();

  const { cover, setCurrentEditableItem } = useCoverEditorContext();

  const onEditText = useCallback(
    (index: number) => {
      setCurrentEditableItem({
        type: 'text',
        index,
      });
    },
    [setCurrentEditableItem],
  );

  const onEditLinks = useCallback(() => {
    setCurrentEditableItem({
      type: 'links',
    });
  }, [setCurrentEditableItem]);

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

  return (
    <View style={[styles.container, { marginBottom: bottom }]}>
      <View style={styles.content}>
        {cover.textLayers.map((textLayer, index) => {
          return (
            <PressableNative
              style={{ width: '100%' }}
              key={index}
              onPress={() => onEditText(index)}
            >
              <Text
                style={[
                  {
                    ...textLayer.style,
                    color: swapColor(
                      textLayer.style.color,
                      profile.webCard?.cardColors,
                    ),
                  },
                  { width: '100%' },
                ]}
              >
                {textLayer.text}
              </Text>
            </PressableNative>
          );
        })}
        <PressableNative
          style={{ width: '100%', flexDirection: 'row' }}
          onPress={() => onEditLinks()}
        >
          {cover.linksLayer.links.map(link => {
            return (
              <SocialIcon
                style={{
                  height: cover.linksLayer.style.size,
                  width: cover.linksLayer.style.size,
                  tintColor: swapColor(
                    cover.linksLayer.style.color,
                    profile.webCard?.cardColors,
                  ),
                }}
                key={link.socialId}
                icon={link.socialId as SocialLinkId}
              />
            );
          })}
        </PressableNative>
        {cover.overlayLayer && (
          <Image
            source={{ uri: cover.overlayLayer.uri }}
            contentFit="cover"
            contentPosition="center"
            style={[cover.overlayLayer.style, { width: 200, height: 200 }]}
          />
        )}
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
    backgroundColor: colors.grey200,
    margin: 40,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CoverEditor;
