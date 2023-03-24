import uniq from 'lodash/uniq';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Text, View, StyleSheet, FlatList } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { useRouter } from '#PlatformEnvironment';
import { colors, fontFamilies } from '#theme';
import useViewportSize, { insetBottom, insetTop } from '#hooks/useViewportSize';
import Button from '#ui/Button';
import PressableNative from '#ui/PressableNative';
import TemplateSelectorItem from './TemplateSelectorItem';
import type {
  TemplateSelector_viewer$data,
  TemplateSelector_viewer$key,
} from '@azzapp/relay/artifacts/TemplateSelector_viewer.graphql';
import type { TemplateSelectorProfileMutation } from '@azzapp/relay/artifacts/TemplateSelectorProfileMutation.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';

import type { ListRenderItemInfo } from 'react-native';

export type TemplateSelectorProps = {
  /**
   * The relay viewer reference
   */
  viewer: TemplateSelector_viewer$key;
};

const TemplateSelector = ({ viewer: viewerKey }: TemplateSelectorProps) => {
  const vp = useViewportSize();
  const intl = useIntl();
  const router = useRouter();
  const skip = useCallback(() => {
    router.back();
  }, [router]);

  const { profile, coverTemplates } = useFragment(
    graphql`
      fragment TemplateSelector_viewer on Viewer {
        profile {
          id
          colorPalette
        }
        coverTemplates {
          id
          colorPalette
          ...TemplateSelectorItem_templateData
        }
      }
    `,
    viewerKey,
  );

  const [commit] = useMutation<TemplateSelectorProfileMutation>(graphql`
    mutation TemplateSelectorProfileMutation($input: UpdateProfileInput!) {
      updateProfile(input: $input) {
        profile {
          id
          colorPalette
        }
      }
    }
  `);

  const selectTemplate = useCallback(
    (templateId: string) => {
      if (coverTemplates && profile) {
        const template = coverTemplates.find(t => t?.id === templateId);

        if (template) {
          if (template.colorPalette) {
            const newColorArray = uniq([
              ...(profile.colorPalette ?? []),
              ...template.colorPalette,
            ]);
            commit({
              variables: {
                input: {
                  colorPalette: newColorArray,
                },
              },
              optimisticResponse: {
                updateProfile: {
                  profile: {
                    id: profile.id,
                    colorPalette: newColorArray,
                  },
                },
              },
            });
          }

          router.replace({
            route: 'CARD_MODULE_EDITION',
            params: {
              module: module as any,
              templateId: template.id,
            },
          });
        }
      }
    },
    [commit, coverTemplates, profile, router],
  );

  const renderItem = useCallback(
    ({
      item,
      index,
    }: ListRenderItemInfo<ArrayItemType<TemplateSelector_viewer$data>>) => {
      return (
        <TemplateSelectorItem
          template={item}
          index={index}
          selectTemplate={selectTemplate}
        />
      );
    },
    [selectTemplate],
  );

  const createCover = useCallback(() => {
    router.replace({
      route: 'CARD_MODULE_EDITION',
      params: { module: module as any },
    });
  }, [router]);

  return (
    <View
      style={[
        {
          paddingTop: vp`${insetTop} + ${90}`,
          marginBottom: vp`${insetBottom} + ${10}`,
          flex: 1,
          justifyContent: 'flex-end',
        },
      ]}
    >
      <Text style={[styles.inner, styles.titleText]}>
        <FormattedMessage
          defaultMessage="Choose a visual for your cover"
          description="OnBoarding Cover Component - Title"
        />
      </Text>
      <Text style={[styles.inner, styles.subtitleText]}>
        <FormattedMessage
          defaultMessage="You’ll be able to modify it later"
          description="OnBoarding Cover Component - Subtitle"
        />
      </Text>

      <FlatList
        data={coverTemplates as ArrayItemType<TemplateSelector_viewer$data>} // couldn't find a way to make it work with the fragment without hard casting
        renderItem={renderItem}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center' }}
        horizontal
        ItemSeparatorComponent={() => <View style={{ width: 13 }} />}
        showsHorizontalScrollIndicator={false}
        accessibilityRole="list"
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Horizontal list of Cover Templates',
          description: 'TemplateSelector - AccessibilityLabel List Templates',
        })}
        accessibilityHint="Scroll horizontally to see more templates"
      />
      <Text style={[styles.subtitleText, { paddingTop: 8, paddingBottom: 13 }]}>
        <FormattedMessage
          defaultMessage="or"
          description="OnBoarding Cover Component - Or text"
        />
      </Text>
      <Button
        label={intl.formatMessage({
          defaultMessage: 'Create your cover from scratch',
          description:
            'TemplateSelector - Create your cover from scratch Button',
        })}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Create your cover from scratch',
          description:
            'TemplateSelector - AccessibilityLabel Button Create your cover from scratch',
        })}
        style={[styles.inner, styles.button]}
        onPress={createCover}
      />

      <View
        style={[
          styles.inner,
          {
            marginBottom: vp`${insetBottom} `,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <PressableNative
          onPress={skip}
          accessibilityRole="link"
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Cancel and go back',
            description: 'TemplateSelector - AccessibilityLabel Link Cancel',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Tap to cancel the creation fo your cover',
            description: 'TemplateSelector - AccessibilityHint Link Cancel',
          })}
        >
          <Text style={styles.cancel}>
            <FormattedMessage
              defaultMessage="Cancel"
              description="OnBoarding Cover Component - Link Cancel"
            />
          </Text>
        </PressableNative>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inner: {
    marginLeft: 20,
    marginRight: 20,
  },
  titleText: {
    ...fontFamilies.semiBold,
    fontSize: 20,
    textAlign: 'center',
    paddingTop: 0,
    color: colors.black,
    textAlignVertical: 'center',
  },
  subtitleText: {
    ...fontFamilies.fontMedium,
    fontSize: 14,
    marginLeft: 33,
    marginRight: 33,
    textAlign: 'center',
    paddingBottom: 25,
    paddingTop: 20,
    color: colors.grey400,
  },
  cancel: { color: colors.grey200, marginTop: 22 },
  button: {
    height: 45,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});

export default TemplateSelector;
